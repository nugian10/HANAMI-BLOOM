/* HANAMI BLOOM live counters — totalSupply + mintActive(), read from the
   NFT contract with client-side eth_call calls to a public BSC RPC.
   STATUS: LIVE — contract deployed (v2, 10 Nov 2026), mint ACTIVE.
   The minted counter polls totalSupply() every 3 seconds (one BSC block)
   and the status reads mintActive() every 30 seconds.
   Counts only; never shows prices. Fails soft: shows a dash and retries. */
(function () {
  /* t(): translated string via i18n.js when loaded, else the English
     fallback passed inline (fb). Vars like {n} are substituted. */
  function t(k, fb, vars) {
    if (window.HANAMI_T) return window.HANAMI_T(k, vars);
    var s = fb;
    if (vars) for (var n in vars) s = s.split("{" + n + "}").join(String(vars[n]));
    return s;
  }
  var NFT = "0x9DFc130384A581e0156B8665e8e8c2100fb82621";
  var NOT_DEPLOYED = /^0x0{40}$/.test(NFT);
  var RPCS = [
    "https://bsc-dataseed.binance.org/",
    "https://bsc-dataseed1.defibit.io/",
    "https://bsc-dataseed1.ninicoin.io/"
  ];
  var SEL_MINTED = "0x18160ddd"; // totalSupply()
  var SEL_ACTIVE = "0x25fd90f3"; // mintActive()
  var REFRESH_MS = 30000; // status: mintActive()
  var LIVE_MS = 3000; // minted counter: one BSC block, truly live

  function callRpc(url, to, data) {
    return fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", method: "eth_call", params: [{ to: to, data: data }, "latest"], id: 1 })
    }).then(function (r) { return r.json(); }).then(function (j) {
      if (!j || typeof j.result !== "string") throw new Error("bad rpc result");
      return BigInt(j.result);
    });
  }
  function callFirstRpc(to, data) {
    var chain = Promise.reject(new Error("no rpc"));
    RPCS.forEach(function (url) { chain = chain.catch(function () { return callRpc(url, to, data); }); });
    return chain;
  }
  function setText(kind, value) {
    var els = document.querySelectorAll('[data-live="' + kind + '"]');
    for (var i = 0; i < els.length; i++) els[i].textContent = value;
  }
  function refreshMinted() {
    // Fast live poll: only totalSupply(), every 3s, so the minted
    // counter moves within ~one block of a new mint landing.
    if (NOT_DEPLOYED) { setText("minted", "–"); return; }
    callFirstRpc(NFT, SEL_MINTED).then(function (v) { setText("minted", v.toString()); }).catch(function () { /* keep dash, retry next round */ });
  }
  function refresh() {
    if (NOT_DEPLOYED) {
      // Zero-address guard: if the address were ever the zero address,
      // show dashes and make no NFT contract calls.
      setText("minted", "–");
      setText("status", t("status.coming_soon", "COMING SOON"));
    } else {
      refreshMinted();
      // Optimistic status in the current language: the badge's static
      // default text is Japanese, so without this the badge stays
      // Japanese in EN mode until the RPC below returns (or forever
      // if it fails). The mintActive() call corrects it if the mint
      // is actually closed.
      setText("status", t("status.live", "MINT IS LIVE"));
      callFirstRpc(NFT, SEL_ACTIVE).then(function (v) { setText("status", v === 0n ? t("status.coming_soon", "COMING SOON") : t("status.live", "MINT IS LIVE")); }).catch(function () { /* keep the default text, retry next round */ });
    }
  }
  /* i18n.js calls this on language switch so the mint status
     re-renders in the new language without waiting for the 30s tick. */
  window.HANAMI_LIVE_REFRESH = refresh;
  if (document.querySelector("[data-live]")) {
    refresh();
    setInterval(refreshMinted, LIVE_MS);
    setInterval(refresh, REFRESH_MS);
  }
})();
