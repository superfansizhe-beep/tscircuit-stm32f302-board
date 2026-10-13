#!/usr/bin/env python3
"""
通过 GitHub REST API 推送提交 —— 当 github.com:443 不通、只有 api.github.com 可达时用。

背景：
    本机网络对 github.com 的 HTTPS 经常不通（VPN 不稳），但 api.github.com 一直正常。
    常规 `git push` 走的是 github.com:443，所以推不上去。
    这个脚本改走 Git Data API 把提交一个个重放上去。

原理（用 base_tree 只传改动文件，不用全量重传）：
    对每个待推送提交：
      1. 用 git diff-tree 找出它相对父提交改了哪些文件
      2. 逐个文件 POST /git/blobs 上传内容
      3. POST /git/trees，base_tree=父提交的 tree，只列改动的文件
      4. POST /git/commits 建提交，parent=上一个提交
    最后 PATCH /git/refs/heads/main 指向新提交。

用法：
    cd ~/Desktop/tscircuit/my-tscircuit
    python3 scripts/push-via-api.py [--dry-run]
"""
import base64
import json
import os
import subprocess
import sys
import time
import urllib.error
import urllib.request

REPO = "superfansizhe-beep/tscircuit-stm32f302-board"
API = "https://api.github.com"
BRANCH = "main"
DRY = "--dry-run" in sys.argv


def token():
    """从 macOS keychain 取 GitHub 凭据（不落盘、不打印）。"""
    r = subprocess.run(["git", "credential", "fill"], input="protocol=https\nhost=github.com\n\n",
                       capture_output=True, text=True)
    for line in r.stdout.splitlines():
        if line.startswith("password="):
            return line[9:]
    raise SystemExit("❌ 取不到 GitHub 凭据")


TOK = token()


def api(method, path, body=None, retries=4):
    url = path if path.startswith("http") else API + path
    data = json.dumps(body).encode() if body is not None else None
    for k in range(retries):
        req = urllib.request.Request(url, data=data, method=method, headers={
            "Authorization": f"Bearer {TOK}",
            "Accept": "application/vnd.github+json",
            "Content-Type": "application/json",
            "User-Agent": "push-via-api",
        })
        try:
            with urllib.request.urlopen(req, timeout=60) as r:
                return json.loads(r.read().decode() or "{}")
        except urllib.error.HTTPError as e:
            msg = e.read().decode()[:300]
            if e.code in (502, 503, 504) and k < retries - 1:
                time.sleep(3 * (k + 1))
                continue
            raise SystemExit(f"❌ {method} {path} → {e.code}\n{msg}")
        except Exception as e:
            if k < retries - 1:
                time.sleep(3 * (k + 1))
                continue
            raise SystemExit(f"❌ {method} {path} → {e}")
    return {}


def git(*args, binary=False):
    r = subprocess.run(["git", *args], capture_output=True)
    if r.returncode != 0:
        raise SystemExit(f"❌ git {' '.join(args)}\n{r.stderr.decode()[:300]}")
    return r.stdout if binary else r.stdout.decode().strip()


def commits_to_push():
    """返回 (远端SHA, [待推送提交...] 旧→新)。

    本脚本推上去的提交是**新造的**（SHA 与本地不同），所以远端 HEAD
    未必存在于本地对象库。此时 git log <远端>..HEAD 会失败 ——
    退化为「把当前 HEAD 的完整快照作为一次提交推上去」，返回 None。
    """
    remote_sha = api("GET", f"/repos/{REPO}/git/ref/heads/{BRANCH}")["object"]["sha"]
    print(f"   远端 {BRANCH} = {remote_sha[:7]}")
    known = subprocess.run(["git", "cat-file", "-e", f"{remote_sha}^{{commit}}"],
                           capture_output=True).returncode == 0
    if not known:
        print("   远端提交不在本地对象库 -> 改为推送当前 HEAD 的完整快照")
        return remote_sha, None
    out = git("log", "--reverse", "--format=%H", f"{remote_sha}..HEAD")
    if not out:
        return remote_sha, []
    return remote_sha, out.split("\n")


def changed_files(sha, base_override=None):
    """某提交改了哪些文件 → [(路径, 模式, blob sha)]。

    base_override 给定时走**快照模式**：不做 diff，直接列出该提交的
    全部文件全量上传（用于远端 SHA 不在本地、无法 diff 的情况）。
    """
    if base_override:
        out = []
        for line in git("ls-tree", "-r", "-z", sha).split("\0"):
            if not line:
                continue
            meta, path = line.split("\t", 1)
            mode, _typ, blob = meta.split()
            out.append((path, mode, blob))
        return out
    parents = git("log", "-1", "--format=%P", sha).split()
    if not parents:
        base = "4b825dc642cb6eb9a060e54bf8d69288fbee4904"
    else:
        base = parents[0]
    raw = git("diff-tree", "-r", "--no-commit-id", "--raw", "-z", base, sha)
    # -z 输出：每个条目是 :oldmode newmode oldsha newsha status\0path\0
    parts = raw.split("\0")
    res = []
    i = 0
    while i < len(parts):
        p = parts[i]
        if not p.startswith(":"):
            i += 1
            continue
        meta = p[1:].split()
        newmode, newsha, status = meta[1], meta[3], meta[4]
        path = parts[i + 1] if i + 1 < len(parts) else ""
        # 重命名/复制在 -z 下会多一个路径字段
        if status.startswith(("R", "C")):
            path = parts[i + 2]
            i += 1
        res.append((path, newmode, newsha))
        i += 1
    return res


def blob_content(sha):
    return subprocess.run(["git", "cat-file", "blob", sha], capture_output=True).stdout


def main():
    print("── 确定要推送的提交")
    remote_sha, shas = commits_to_push()
    if shas == []:
        print("   ✅ 远端已是最新，无需推送")
        return 0
    snapshot = shas is None
    shas = [git("rev-parse", "HEAD")] if snapshot else shas
    print("   模式：单次快照" if snapshot else f"   待推送 {len(shas)} 个提交")

    # 远端当前 tree 作为 base_tree 的起点
    parent_commit = remote_sha
    # ⚠️ 必须**自己记住 tree SHA**，不能用 git rev-parse <commit>^{tree} ——
    #    API 建出来的提交不在本地对象库里，rev-parse 会报 unknown revision。
    parent_tree = api("GET", f"/repos/{REPO}/git/commits/{remote_sha}")["tree"]["sha"]
    n_blob = 0

    for i, sha in enumerate(shas, 1):
        subj = git("log", "-1", "--format=%s", sha)[:66]
        files = changed_files(sha, base_override=parent_tree if snapshot else None)
        print(f"\n── [{i}/{len(shas)}] {sha[:7]}  {subj}")
        print(f"   改动 {len(files)} 个文件")

        if DRY:
            for p, m, s in files[:8]:
                print(f"      {m}  {p}")
            if len(files) > 8:
                print(f"      … 另 {len(files) - 8} 个")
            continue

        tree_entries = []
        for path, mode, blob_sha in files:
            if blob_sha == "0" * 40 or mode == "000000":
                tree_entries.append({"path": path, "mode": "100644", "sha": None})
                print(f"      − 删除 {path}")
                continue
            content = blob_content(blob_sha)
            r = api("POST", f"/repos/{REPO}/git/blobs", {
                "content": base64.b64encode(content).decode(),
                "encoding": "base64",
            })
            n_blob += 1
            tree_entries.append({
                "path": path,
                "mode": "100755" if mode == "100755" else "100644",
                "sha": r["sha"],
            })
        print(f"      上传 {n_blob} 个 blob（累计）")

        tree = api("POST", f"/repos/{REPO}/git/trees", {
            "base_tree": parent_tree,
            "tree": tree_entries,
        })
        msg = git("log", "-1", "--format=%B", sha)
        commit = api("POST", f"/repos/{REPO}/git/commits", {
            "message": msg,
            "tree": tree["sha"],
            "parents": [parent_commit],
        })
        parent_commit = commit["sha"]
        parent_tree = tree["sha"]
        print(f"      → {commit['sha'][:7]}")

    if DRY:
        print("\n（dry-run，未实际推送）")
        return 0

    print(f"\n── 更新 {BRANCH} 指向 {parent_commit[:7]}")
    api("PATCH", f"/repos/{REPO}/git/refs/heads/{BRANCH}",
        {"sha": parent_commit, "force": False})
    print("   ✅ 完成")

    # 本地记录远端位置，让 git status 不再显示"待推送"
    subprocess.run(["git", "update-ref", f"refs/remotes/origin/{BRANCH}", parent_commit])
    print(f"   本地 origin/{BRANCH} 已更新")
    return 0


if __name__ == "__main__":
    sys.exit(main())
