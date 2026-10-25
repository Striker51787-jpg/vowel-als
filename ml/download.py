"""Download VOC-ALS from Synapse (syn53009474) into ml/data/raw/.

Needs a free Synapse account. Create a personal access token at
synapse.org → Account Settings → Personal Access Tokens, then either save it in
~/.synapseConfig:

    [authentication]
    authtoken = <your token>

or export it as SYNAPSE_AUTH_TOKEN before running:  python download.py

You can also download the files by hand from the website into ml/data/raw/.
"""
from pathlib import Path

import synapseclient
import synapseutils

PROJECT_ID = "syn53009474"
OUT = Path(__file__).parent / "data" / "raw"

if __name__ == "__main__":
    OUT.mkdir(parents=True, exist_ok=True)
    syn = synapseclient.login(silent=True)  # reads the token from config or env
    files = synapseutils.syncFromSynapse(syn, PROJECT_ID, path=str(OUT))
    print(f"Downloaded {len(files)} files to {OUT}")
