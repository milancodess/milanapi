const { GoogleGenerativeAI } = require("@google/generative-ai");
const fetch = require('node-fetch');
const genAI = new GoogleGenerativeAI(`AIzaSyBD3z1Hk3atVVLmHCqQiTejo_YJHUCkNs8`);
if (!global.temp.gemini) global.temp.gemini = {};

const { gemini } = global.temp;

module.exports = {
  config: {
    name: "gemini",
    version: "3.0",
    role: 0,
    countDown: 10,
    author: "MILAN",
    shortDescription: { en: "Google Gemini" },
    longDescription: { en: "Google Gemini" },
    category: "ai",
    guide: {
      en: "{pn} [<prompt> | <image Reply>]"
    }
  },
  onStart: async function({ message, args, event, api }) {
    if (!args[0]) return message.SyntaxError();
    if (args[0].toLowerCase() == "clear") {
      gemini[event.senderID] = [];
      return message.reply("Context Cleared")
    }
    let type;
    let model;
    if (event?.messageReply?.attachments[0]?.type == "photo") {
      type = "imageReply";
      model = "gemini-1.5-flash"
    } else {
      type = "text"
      model = "gemini-1.5-flash"
    }
    return await GeminiUse({
      prompt: args.join(" "),
      model,
      type,
      event,
      message,
      api
    })
  },

  onReply: async function({ message, event, Reply, args, api }) {
    let { author, commandName, messageID, text } = Reply;
    if (event.senderID != author) return;
    if (event?.messageReply?.attachments[0] && !args[0]) return message.reply("You can't reply with images")
    if (!args[0]) return message.SyntaxError();
    try {
      if (args[0].toLowerCase() == "clear") {
        global.GoatBot.onReply.delete(messageID);
        gemini[event.senderID] = [];
        await api.editMessage("Context Cleared", messageID);
        await new Promise(resolve => setTimeout(resolve, 5000));
        return await api.editMessage(text + "\n\nContext Cleared", messageID);
      }
      global.GoatBot.onReply.delete(messageID);
      const type = "text";
      const model = "gemini-1.5-flash";

      return await GeminiUse({
        prompt: args.join(" "),
        model,
        type,
        event,
        message,
        api
      })
    } catch (e) {
      message.reaction("❌", event.messageID);
      console.error(e);
      message.reply({ body: e.message, attachment: await global.utils.getStreamFromURL("https://i.ibb.co/Chv8D0T/uploaded-tanvir.jpg") });
    }
  }
}

async function GeminiUse({ prompt, model, type, event, message, api }) {
  switch (type) {
    case 'imageReply':
      return await vision({ prompt, model, event, message, api });
    case 'text':
      return await geminiText({ prompt, model, event, message, api });
    default:
      return message.SyntaxError();
  }
}

async function geminiText({ prompt, model, event, message, api }) {
  if (!gemini[event.senderID] || !Array.isArray(gemini[event.senderID])) {
    gemini[event.senderID] = [];
  }
  const ready = await message.reply("Gemini Is Cooking");
  let chatBlock = [...gemini[event.senderID]];

  const systemPrompt = "You are a helpful and knowledgeable assistant. Please respond concisely and politely.";

  const chatModel = await genAI.getGenerativeModel({ model });
  const chat = await chatModel.startChat({
    history: [{ role: "system", parts: systemPrompt }, ...chatBlock],
    generationConfig: {
      maxOutputTokens: 1500,
    },
  });
  const result = await chat.sendMessage(prompt);
  const response = await result.response;
  let responseText = await response.text();

  gemini[event.senderID].push(
    { role: "user", parts: prompt },
    { role: "model", parts: responseText }
  );

  if (!responseText || responseText.length === 0) {
    global.GoatBot.onReply.delete(ready.messageID);
    gemini[event.senderID] = [];
    return await api.editMessage(
      "You have surpassed the allocated contextual quota. Consequently, we have purged your contextual history, affording you the opportunity to initiate a fresh instance.",
      ready.messageID
    );
  }
  responseText = responseText.replace(/\*/g, '');
  await api.editMessage(responseText ?? "No Reply", ready.messageID);
  global.GoatBot.onReply.set(ready.messageID, {
    commandName: 'gemini',
    messageID: ready.messageID,
    author: event.senderID,
    text: responseText,
  });
}

async function vision({ prompt, model, event, message, api }) {
  if (!gemini[event.senderID] || !Array.isArray(gemini[event.senderID])) {
    gemini[event.senderID] = [];
  }
  const ready = await message.reply("Gemini is Analyzing your Image");

  const systemPrompt = "You are an expert image analyzer. Provide detailed and insightful analysis based on the given image and prompt.";

  async function urlToGenerativePart(url) {
    const response = await fetch(url);
    const data = await response.buffer();
    const base64_images = data.toString('base64');
    return {
      inlineData: { data: base64_images, mimeType: response.headers.get('content-type') },
    };
  }

  async function run(prompt, image_s) {
    const chatModel = await genAI.getGenerativeModel({ model });
    const imageParts = await Promise.all(
      image_s.map(async (image_urls) => urlToGenerativePart(image_urls))
    );

    const result = await chatModel.generateContent([systemPrompt, prompt, ...imageParts]);
    const response = await result.response;
    const text = await response.text();

    gemini[event.senderID].push(
      { role: "user", parts: prompt },
      { role: "model", parts: text }
    );
    return text;
  }

  const images = event.messageReply.attachments.map(items => items.url);
  const replied = await run(prompt, images);
  await api.editMessage(replied, ready.messageID);
  global.GoatBot.onReply.set(ready.messageID, {
    commandName: 'gemini',
    messageID: ready.messageID,
    author: event.senderID,
    text: replied
  });
}
