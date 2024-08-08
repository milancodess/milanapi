const https = require("https");

export function createScreenshot(url) {
  return new Promise((resolve, reject) => {
    const screenshotURL = `https://image.thum.io/get/width/1920/crop/400/fullpage/noanimate/?url=${encodeURIComponent(url)}`;

    https
      .get(screenshotURL, (response) => {
        if (response.statusCode === 200) {
          resolve(response);
        } else {
          reject(new Error(`Failed to generate screenshot. Status code: ${response.statusCode}`));
        }
      })
      .on("error", (error) => {
        reject(error);
      });
  });
}
