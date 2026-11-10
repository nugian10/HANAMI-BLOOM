#!/usr/bin/env python3
"""Submit HANAMI BLOOM v2 contracts for BscScan source verification.

Mirrors custom.bscscan's bscscan_verify.py (same endpoint, settings and
credential flow) but with Hanami's contract addresses, names and the
constructor args extracted from the on-chain deploy transactions.
"""
import json, sys, urllib.parse, urllib.request

sys.path.insert(0, "/opt/muse/skills/custom-connector-setup/bin")
from dynamic_credentials import read_json_response, url_with_surrogate_query_param

CONNECTOR = "custom.bscscan"
RPCS = [
    "https://bsc-dataseed.binance.org/",
    "https://bsc-dataseed1.binance.org/",
    "https://bsc-dataseed2.binance.org/",
    "https://bsc-dataseed3.binance.org/",
]
API = "https://api.etherscan.io/v2/api?chainid=56"

CONTRACTS = {
    "token": {
        "address": "0xe08E6C2c7a6f2056470b971087dDEf43c3b21bC5",
        "name": "HanaToken",
        "artifact": "artifacts/contracts/HanaToken.sol/HanaToken.json",
        "source": "HanaToken.flattened.sol",
        "deploy_tx": "0x06ebba752ec05f6a8c1cae0f00604bd3731801e0455de0984019fef721828827",
    },
    "nft": {
        "address": "0x9DFc130384A581e0156B8665e8e8c2100fb82621",
        "name": "HanamiBloomNFT",
        "artifact": "artifacts/contracts/HanamiBloomNFT.sol/HanamiBloomNFT.json",
        "source": "HanamiBloomNFT.flattened.sol",
        "deploy_tx": "0xf98a22a97194b425f2bdfd9f2b1a68d90eb67302da593ca8b5bc4041121e1029",
    },
    "nft_v3": {
        "address": "0x8A742EcE2a8C1dCc5dE792A062dbEe9C00A74640",
        "name": "HanamiBloomNFTv3",
        "artifact": "artifacts/contracts/HanamiBloomNFTv3.sol/HanamiBloomNFTv3.json",
        "source": "HanamiBloomNFTv3.flattened.sol",
        "deploy_tx": "0x2af363aa5c050e97a49b5fecc18f7b28d892c23a712656fda34f7272b1de9dc8",
    },
    "market": {
        "address": "0x46897898625b71E2b1247515dfFfd2C51Dfacf7d",
        "name": "HanamiMarket",
        "artifact": "artifacts/contracts/HanamiMarket.sol/HanamiMarket.json",
        "source": "HanamiMarket.flattened.sol",
        "deploy_tx": "0xa745be2a75e64ceb774bb9ad833681b2f90628a91d90c549308e2c197da9f8ea",
    },
}

class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, *args):
        raise RuntimeError("redirect refused")

def rpc(method, params):
    body = json.dumps({"jsonrpc": "2.0", "method": method, "params": params, "id": 1}).encode()
    last = None
    for url in RPCS:
        try:
            req = urllib.request.Request(url, data=body, headers={"Content-Type": "application/json"})
            with urllib.request.build_opener(NoRedirect()).open(req, timeout=30) as r:
                return json.load(r)["result"]
        except Exception as e:
            last = e
    raise last

def constructor_args(cfg):
    cached = "/tmp/nft-deploy-input.txt" if cfg["name"] == "HanamiBloomNFT" else None
    if cached:
        data = open(cached).read().strip().removeprefix("0x")
    else:
        tx = rpc("eth_getTransactionByHash", [cfg["deploy_tx"]])
        data = tx["input"].removeprefix("0x")
    art = json.load(open(cfg["artifact"]))
    creation = art["bytecode"].removeprefix("0x")
    if not data.startswith(creation):
        print(f"{cfg['name']}: creation code mismatch! tx input does not start with artifact bytecode", file=sys.stderr)
        sys.exit(1)
    args = data[len(creation):]
    print(f"{cfg['name']}: constructor args ({len(args)//2} bytes): {args[:80]}...")
    return args

def submit(kind):
    cfg = CONTRACTS[kind]
    args = constructor_args(cfg)
    source = open(cfg["source"], encoding="utf-8").read()
    fields = {
        "module": "contract",
        "action": "verifysourcecode",
        "contractaddress": cfg["address"],
        "sourceCode": source,
        "codeformat": "solidity-single-file",
        "contractname": cfg["name"],
        "compilerversion": "v0.8.24+commit.e11b9ed9",
        "optimizationUsed": "1",
        "runs": "200",
        "licenseType": "3",
        "evmversion": "cancun",
        "constructorArguements": args,
        "chainid": "56",
    }
    body = urllib.parse.urlencode(fields).encode("utf-8")
    url = url_with_surrogate_query_param(API, CONNECTOR, allowed_hosts=["api.etherscan.io", "api.bscscan.com"])
    req = urllib.request.Request(url, data=body, method="POST",
                                 headers={"Content-Type": "application/x-www-form-urlencoded"})
    with urllib.request.build_opener(NoRedirect()).open(req, timeout=60) as r:
        print(json.dumps(read_json_response(r)))

if __name__ == "__main__":
    submit(sys.argv[1])
