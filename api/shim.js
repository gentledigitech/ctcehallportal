/* Vercel shim: makes google.script.run work outside Apps Script */
(function () {
  const ENDPOINT = "/api/exec";

  async function callBackend(action, args) {
    const res = await fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: action, args: args })
    });
    if (!res.ok) throw new Error("Server responded with " + res.status);
    return await res.json();
  }

  function makeRunner() {
    let onSuccess = null;
    let onFailure = null;
    let userObject = null;

    const base = {
      withSuccessHandler(fn) { onSuccess = fn; return proxy; },
      withFailureHandler(fn) { onFailure = fn; return proxy; },
      withUserObject(obj)    { userObject = obj; return proxy; }
    };

    const proxy = new Proxy(base, {
      get(target, prop) {
        if (prop in target) return target[prop];
        return function (...args) {
          callBackend(String(prop), args)
            .then(result => { if (onSuccess) onSuccess(result, userObject); })
            .catch(err   => { if (onFailure) onFailure(err, userObject); });
        };
      }
    });

    return proxy;
  }

  window.google = {
    script: {
      get run() { return makeRunner(); }
    }
  };
})();
