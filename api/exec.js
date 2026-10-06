const APPS_SCRIPT_URL = process.env.APPS_SCRIPT_URL;

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, message: "Method not allowed" });
  }

  try {
    if (!APPS_SCRIPT_URL) {
      return res.status(500).json({ success: false, message: "APPS_SCRIPT_URL is not set in Vercel." });
    }

    const upstream = await fetch(APPS_SCRIPT_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(req.body),
      redirect: "follow"
    });

    const text = await upstream.text();

    let data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      return res.status(502).json({
        success: false,
        message: "Upstream returned non-JSON. Check that your Apps Script deployment access is set to 'Anyone'.",
        raw: text.slice(0, 400)
      });
    }

    return res.status(200).json(data);

  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};
