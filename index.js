const instagram_download = require("./test");
(async () => {
  const value = await instagram_download.downloadMedia(
    "https://www.ddinstagram.com/reel/DADNc8DimE8/?igsh=MXFwZzN2MmJwODV2cw==",
    "./",
  );
  console.log(value);
})();

