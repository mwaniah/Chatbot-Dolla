from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import os
import requests
from dotenv import load_dotenv
import re
import nltk
from nltk.corpus import stopwords
from nltk.tokenize import word_tokenize

# Download NLTK data (only needs to be done once)
try:
    stopwords.words('english')
except LookupError:
    nltk.download('stopwords')
try:
    nltk.data.find('tokenizers/punkt')
except LookupError:
    nltk.download('punkt')
try:
    nltk.data.find('taggers/averaged_perceptron_tagger')
except LookupError:
    nltk.download('averaged_perceptron_tagger')

load_dotenv()

app = Flask(__name__, static_folder='.')
CORS(app)

API_KEY = os.getenv("FINANCIAL_MODELING_PREP_API_KEY")
BASE_URL = "https://financialmodelingprep.com/api/v3"

def extract_financial_term(text):
    """
    Extracts the most likely financial term from a user's query
    using NLTK for more accurate NLP.
    """
    # Tokenize the text and remove stop words
    stop_words = set(stopwords.words('english'))
    words = word_tokenize(text.lower())
    filtered_words = [word for word in words if word.isalpha() and word not in stop_words]
    
    # Part-of-speech tagging to find nouns
    tagged_words = nltk.pos_tag(filtered_words)
    nouns = [word for word, pos in tagged_words if pos.startswith('NN')]
    
    if nouns:
        return " ".join(nouns)
    return " ".join(filtered_words) # Fallback to all non-stop words

@app.route("/")
def serve_index():
    return send_from_directory('.', 'index.html')

@app.route("/<path:path>")
def serve_static(path):
    return send_from_directory('.', path)

def get_definition(term):
    if not term:
        return None

    # First, try the whole query
    url = f"{BASE_URL}/financial-dictionary?query={term}&apikey={API_KEY}"
    response = requests.get(url)

    if response.status_code == 200:
        data = response.json()
        if data:
            return data[0].get("definition")

    # If the whole query fails, try to extract the financial term
    extracted_term = extract_financial_term(term)
    if extracted_term:
        url = f"{BASE_URL}/financial-dictionary?query={extracted_term}&apikey={API_KEY}"
        response = requests.get(url)
        if response.status_code == 200:
            data = response.json()
            if data:
                return data[0].get("definition")
    return None

def is_greeting(text):
    return any(greeting in text.lower() for greeting in ["hello", "hi", "hey"])

def get_bot_history():
    return "I was created by a brilliant developer to help people with their finances. 😊"

def calculate(expression):
    try:
        # Sanitize the expression to prevent security risks
        if not re.match(r"^[0-9+\-*/(). ]+$", expression):
            return None
        return eval(expression)
    except:
        return None

@app.route("/api/chat", methods=["POST"])
def chat():
    data = request.get_json()
    message = data.get("message", "").strip()
    allowance_str = data.get("allowance")
    expenses_str = data.get("expenses")

    # Priority 1: Calculation from allowance and expenses
    if allowance_str and expenses_str:
        try:
            allowance = float(allowance_str)
            expenses = float(expenses_str)
            savings = allowance - expenses
            if savings < 0:
                reply_message = (
                    f"It looks like your expenses are higher than your allowance. "
                    f"You have a deficit of Ksh{abs(savings):.2f}.<br><br>"
                    f"<b>Here are some tips to help you manage your budget:</b><br>"
                    f"- Track your spending to see where your money is going.<br>"
                    f"- Create a budget to plan how you'll spend your money.<br>"
                    f"- Cut back on non-essential spending.<br><br>"
                    f"<b>Consider categorizing your expenses to see where you can save, for example:</b><br>"
                    f"- Food<br>"
                    f"- Transportation<br>"
                    f"- Entertainment<br>"
                    f"- Personal Care"
                )
                return jsonify({"reply": reply_message})
            else:
                reply_message = f"Based on your allowance and expenses, your savings are: Ksh{savings:.2f}.<br><br>Would you like me to create a budget plan for you?"
                return jsonify({"reply": reply_message, "buttons": ["Yes", "No"]})
        except (ValueError, TypeError):
            pass  # Fall through if conversion fails

    if not message:
        return jsonify({"reply": "Please provide a message."})

    # Priority 2: Greeting
    if is_greeting(message):
        return jsonify({"reply": "Hi! My name is Dolla your Finance bot, how can i help you today? 😊"})

    # Priority 3: History
    if "history" in message.lower() or "who are you" in message.lower():
        return jsonify({"reply": get_bot_history()})

    # Priority 4: Function or Purpose
    if any(word in message.lower() for word in ["function", "purpose", "what do you do"]):
        return jsonify({"reply": "I help users manage their money by taking their allowances and expenses to create a budget summary, spending insights and overall financial health."})

    # Priority 5: Mathematical calculation from message
    calculation_result = calculate(message)
    if calculation_result is not None:
        return jsonify({"reply": str(calculation_result)})

    # Priority 6: Financial term definition
    financial_terms = {
        "savings": "Savings is the money you keep after paying for all your needs. Think of it as leftover money you can use for fun things or for later!",
        "income": "Income is all the money you get. It can be from your parents, a job, or even gifts. It's the money you have to spend or save.",
        "expense": "An expense is anything you spend money on. This could be snacks, toys, or bus fare. It's the money going out.",
        "budget": "A budget is a plan for your money. You decide how much to spend and how much to save. It helps you make sure you have enough money for what you need.",
        "allowance": "An allowance is a set amount of money you get regularly, maybe every week or month. It's your own money to manage.",
        "debt": "Debt is when you owe someone money. If you borrow money from a friend, you have a debt to pay back.",
        "loan": "A loan is when you borrow money from a person or a bank. You have to pay it back, usually with a little extra.",
        "interest": "Interest is the extra money you have to pay back when you get a loan. It's like a fee for borrowing the money.",
        "credit": "Credit is your power to borrow money. Having good credit means people trust you to pay back what you borrow.",
        "bank": "A bank is a safe place to keep your money. They can also help you with loans and other money things.",
        "balance": "Your balance is the total amount of money you have in your bank account right now.",
        "deposit": "A deposit is when you put money into your bank account. You're adding to your balance.",
        "withdrawal": "A withdrawal is when you take money out of your bank account. You're subtracting from your balance.",
        "transaction": "A transaction is any time money moves in or out of your account. Deposits and withdrawals are both transactions.",
        "profit": "Profit is the money you make after you sell something for more than it cost you to get it. It's the extra money you earned.",
        "loss": "A loss is when you sell something for less than it cost you. You end up with less money than you started with.",
        "net worth": "Your net worth is all the things you own that are worth money, minus any debts you have. It's a snapshot of how much you're worth financially.",
        "asset": "An asset is anything you own that has value. This could be cash, a bike, or even a video game.",
        "liability": "A liability is any debt you owe. It's money you have to pay back to someone else."
    }

    for term, definition in financial_terms.items():
        if (term in message.lower() and "what" in message.lower()) or message.lower() == term:
            return jsonify({"reply": f"{definition}<br><br>I hope you learned 😊"})

    definition = get_definition(message)
    if definition:
        return jsonify({"reply": definition})

    # Fallback
    return jsonify({"reply": "I'm sorry, I don't have an answer for that. I can define financial terms, or you can ask me to make a calculation."})


if __name__ == "__main__":
    app.run(debug=True, port=5001)
