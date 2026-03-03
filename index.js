const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');

const token = process.env.BOT_TOKEN;
const tmdbKey = process.env.TMDB_KEY;
const channel = process.env.CHANNEL_USERNAME;
const adminId = process.env.ADMIN_ID;

const bot = new TelegramBot(token, { polling: true });

let pendingPost = null;

bot.onText(/\/post (.+)/, async (msg, match) => {

    if (msg.from.id.toString() !== adminId) {
        return bot.sendMessage(msg.chat.id, "⛔ Unauthorized.");
    }

    const query = match[1];

    try {

        const search = await axios.get(
            `https://api.themoviedb.org/3/search/multi?api_key=${tmdbKey}&query=${encodeURIComponent(query)}`
        );

        if (!search.data.results.length) {
            return bot.sendMessage(msg.chat.id, "❌ Not found.");
        }

        const data = search.data.results[0];

        const title = data.title || data.name;
        const year = data.release_date?.slice(0,4) || data.first_air_date?.slice(0,4) || "N/A";
        const rating = data.vote_average || "N/A";
        const language = data.original_language?.toUpperCase() || "N/A";
        const overview = data.overview || "No description available.";
        const type = data.media_type === "tv" ? "TV Series" : "Movie";

        const caption = 
`🎬 *${title}* (${year})

📌 Type: ${type}
⭐ Rating: ${rating}/10
🌍 Language: ${language}

📝 ${overview}

#${title.replace(/\s+/g, '')}`;

        const posterUrl = data.poster_path
            ? `https://image.tmdb.org/t/p/w500${data.poster_path}`
            : null;

        pendingPost = { caption, posterUrl };

        await bot.sendPhoto(msg.chat.id, posterUrl, {
            caption,
            parse_mode: "Markdown",
            reply_markup: {
                inline_keyboard: [
                    [
                        { text: "✅ Publish", callback_data: "publish" },
                        { text: "❌ Cancel", callback_data: "cancel" }
                    ]
                ]
            }
        });

    } catch (err) {
        bot.sendMessage(msg.chat.id, "⚠️ Error occurred.");
    }
});

bot.on("callback_query", async (query) => {

    if (query.from.id.toString() !== adminId) return;

    if (query.data === "publish" && pendingPost) {

        if (pendingPost.posterUrl) {
            await bot.sendPhoto(channel, pendingPost.posterUrl, {
                caption: pendingPost.caption,
                parse_mode: "Markdown"
            });
        } else {
            await bot.sendMessage(channel, pendingPost.caption, {
                parse_mode: "Markdown"
            });
        }

        pendingPost = null;
        bot.answerCallbackQuery(query.id, { text: "✅ Posted!" });

    } else if (query.data === "cancel") {

        pendingPost = null;
        bot.answerCallbackQuery(query.id, { text: "❌ Cancelled." });
    }
});

console.log("Bot Running...");
