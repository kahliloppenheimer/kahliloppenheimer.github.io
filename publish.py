import sys
import time
import subprocess
import os

oldPath = sys.argv[1]
# Rename file with today's date appended and path for _posts instead of _drafts
newPath = "/".join(oldPath.split('/')[:-1]) + '/../_posts/' + time.strftime('%Y-%m-%d-') + oldPath.split('/')[-1]
# Move file from _drafts to _posts
os.rename(oldPath, newPath)
# Push change to github
commitMsg = "Publishing new post " + newPath.split('/')[-1]
print commitMsg
subprocess.call(["git", "add", newPath])
subprocess.call(["git", "commit", "-m", commitMsg])
subprocess.call(["git", "pull"])
subprocess.call(["git", "push"])
