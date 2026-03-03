import telebot
import requests

# আপনার কনফিগুরেশন (সব সেটআপ করা আছে)
BOT_TOKEN = '8748842905:AAGaW2fFUUI_qu78gvkohzPwId5CaY0HWk0'
TMDB_API_KEY = '90cf87d009df651d6394493cad3dfb91'

bot = telebot.TeleBot(BOT_TOKEN)

@bot.message_handler(commands=['start', 'help'])
def send_welcome(message):
    bot.reply_to(message, "🎬 **NexFlix Movie Poster Bot**\n\nমুভির নাম লিখে পাঠান, আমি প্রফেশনাল পোস্টার এবং ডিটেইলস তৈরি করে দিচ্ছি।", parse_mode='Markdown')

@bot.message_handler(func=lambda message: True)
def professional_post(message):
    movie_name = message.text.strip()
    
    # TMDB API থেকে ডাটা আনা
    url = f"https://api.themoviedb.org/3/search/movie?api_key={TMDB_API_KEY}&query={movie_name}"
    response = requests.get(url).json()

    if response['results']:
        movie = response['results'][0]
        title = movie['title'].upper()
        year = movie.get('release_date', 'N/A')[:4]
        rating = movie.get('vote_average', 'N/A')
        overview = movie.get('overview', 'No description available.')
        poster_path = movie.get('poster_path')
        
        # হাই-কোয়ালিটি পোস্টার লিঙ্ক
        poster_url = f"https://image.tmdb.org/t/p/original{poster_path}"

        # প্রিমিয়াম এবং স্ট্রং ক্যাপশন ডিজাইন
        caption = (
            f"🎬 **{title}** ({year})\n"
            f"━━━━━━━━━━━━━━━━━━━━━\n"
            f"⭐ **RATING :** `{rating} / 10` 🌟\n"
            f"📅 **RELEASE:** `{year}`\n"
            f"🎭 **GENRE  :** Movie\n"
            f"━━━━━━━━━━━━━━━━━━━━━\n\n"
            f"📖 **STORYLINE:**\n"
            f"_{overview[:500]}..._\n\n"
            f"⚡ **POWERED BY NEXFLIX**"
        )

        try:
            bot.send_photo(message.chat.id, poster_url, caption=caption, parse_mode='Markdown')
        except:
            # যদি হাই-কোয়ালিটি লোড না হয়, নরমাল কোয়ালিটি ট্রাই করবে
            fallback_url = f"https://image.tmdb.org/t/p/w500{poster_path}"
            bot.send_photo(message.chat.id, fallback_url, caption=caption, parse_mode='Markdown')
    else:
        bot.reply_to(message, "❌ **Movie not found!** Please check the spelling.")

# বট রান করা
print("NexFlix Bot is Running...")
bot.polling()
