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
        return None, None

    # First, try the whole query
    url = f"{BASE_URL}/financial-dictionary?query={term}&apikey={API_KEY}"
    response = requests.get(url)

    if response.status_code == 200:
        data = response.json()
        if data:
            return term, data[0].get("definition")

    # If the whole query fails, try to extract the financial term
    extracted_term = extract_financial_term(term)
    if extracted_term:
        url = f"{BASE_URL}/financial-dictionary?query={extracted_term}&apikey={API_KEY}"
        response = requests.get(url)
        if response.status_code == 200:
            data = response.json()
            if data:
                return extracted_term, data[0].get("definition")
    return None, None

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
    if "importance of saving" in message.lower():
        return jsonify({"reply": "<b>The Importance of Saving:</b><br><br>Saving money is essential for financial security and achieving your goals. Here are some key reasons why saving is important:<br><br><b>1. Emergency Fund:</b> Unexpected events like medical emergencies or job loss can happen. Having a savings cushion helps you navigate these situations without going into debt.<br><b>2. Financial Goals:</b> Whether you want to buy a new gadget, go on a vacation, or save for a down payment on a house, saving is the first step to reaching your financial goals.<br><b>3. Financial Independence:</b> Saving and investing can help you build wealth over time, leading to financial independence where you have the freedom to make life choices without being constrained by money.<br><b>4. Reduced Stress:</b> Knowing you have money saved for the future can reduce financial stress and anxiety.<br><b>5. Retirement:</b> Saving for retirement is crucial to ensure you have enough money to live comfortably when you stop working."})

    how_to_guides = {
        "save": "<b>How to Save Money:</b><br><br>Saving money is a key habit for financial success. Here are some practical steps to get started:<br><br><b>1. Create a Budget:</b> Track your income and expenses to see where your money is going. This will help you identify areas where you can cut back.<br><b>2. Set Savings Goals:</b> Whether it's for an emergency fund, a down payment, or a vacation, having clear goals will keep you motivated.<br><b>3. Pay Yourself First:</b> Treat your savings like a bill. Set up automatic transfers to your savings account each payday.<br><b>4. Reduce Expenses:</b> Look for ways to cut back on non-essential spending, such as eating out less or canceling unused subscriptions.<br><b>5. Increase Your Income:</b> Consider a side hustle or asking for a raise to boost your savings.",
        "budget": "<b>How to Budget:</b><br><br>A budget is a roadmap for your money. Here’s how to create one:<br><br><b>1. Track Your Income:</b> List all your sources of income.<br><b>2. Track Your Expenses:</b> For a month, write down everything you spend money on. Categorize your expenses (e.g., housing, food, transportation, entertainment).<br><b>3. Set Financial Goals:</b> Decide what you want to achieve with your money (e.g., pay off debt, save for a car).<br><b>4. Create a Plan:</b> Allocate your income to your expenses and savings goals. The 50/30/20 rule is a popular guideline: 50% for needs, 30% for wants, and 20% for savings.<br><b>5. Review and Adjust:</b> Your budget isn’t set in stone. Review it regularly and make adjustments as your income or expenses change.",
        "invest": "<b>How to Invest:</b><br><br>Investing can help your money grow over time. Here’s a simplified guide to get started:<br><br><b>1. Define Your Goals:</b> What are you investing for? Retirement, a down payment, or something else? Your goals will determine your investment strategy.<br><b>2. Understand Your Risk Tolerance:</b> How comfortable are you with the possibility of losing money? Generally, higher-risk investments have the potential for higher returns, but also higher losses.<br><b>3. Choose Your Investments:</b> There are many types of investments, including:<br>    - <b>Stocks:</b> Ownership in a single company.<br>    - <b>Bonds:</b> A loan to a company or government.<br>    - <b>Mutual Funds and ETFs:</b> Baskets of stocks, bonds, or other investments.<br><b>4. Open an Investment Account:</b> You can open an investment account with a brokerage firm.<br><b>5. Start Small and Be Consistent:</b> You don’t need a lot of money to start investing. The key is to invest regularly over time."
    }

    for keyword, guide in how_to_guides.items():
        if f"how to {keyword}" in message.lower() or f"how can i {keyword}" in message.lower():
            return jsonify({"reply": guide})

    financial_terms = {
        "debt management": "Debt management is the process of creating a plan to pay back the money you owe. It involves creating a budget, prioritizing your debts, and finding strategies to pay them off efficiently.",
        "snowball method": "The debt snowball method is a debt-reduction strategy where you pay off your debts in order of smallest to largest, regardless of interest rate. You make minimum payments on all your debts, then use any extra money to pay off the smallest one first. Once that's paid off, you roll that payment into the next-smallest debt. This method can be motivating because you see quick wins.",
        "debt snowball": "The debt snowball method is a debt-reduction strategy where you pay off your debts in order of smallest to largest, regardless of interest rate. You make minimum payments on all your debts, then use any extra money to pay off the smallest one first. Once that's paid off, you roll that payment into the next-smallest debt. This method can be motivating because you see quick wins.",
        "snowball": "The debt snowball method is a debt-reduction strategy where you pay off your debts in order of smallest to largest, regardless of interest rate. You make minimum payments on all your debts, then use any extra money to pay off the smallest one first. Once that's paid off, you roll that payment into the next-smallest debt. This method can be motivating because you see quick wins.",
        "avalanche method": "The debt avalanche method is a debt-reduction strategy where you pay off your debts in order of highest interest rate to lowest, regardless of the balance. You make minimum payments on all your debts, then use any extra money to pay off the one with the highest interest rate first. This method saves you the most money on interest over time.",
        "debt avalanche": "The debt avalanche method is a debt-reduction strategy where you pay off your debts in order of highest interest rate to lowest, regardless of the balance. You make minimum payments on all your debts, then use any extra money to pay off the one with the highest interest rate first. This method saves you the most money on interest over time.",
        "avalanche": "The debt avalanche method is a debt-reduction strategy where you pay off your debts in order of highest interest rate to lowest, regardless of the balance. You make minimum payments on all your debts, then use any extra money to pay off the one with the highest interest rate first. This method saves you the most money on interest over time.",
        "emergency fund": "An emergency fund is a stash of money set aside to cover unexpected financial emergencies, such as a job loss, medical bill, or car repair. It's recommended to have 3-6 months' worth of living expenses saved.",
        "investing": "Investing is the act of using money to buy assets with the hope that they will grow in value over time and provide you with more money in the future. Examples include buying stocks, bonds, or real estate.",
        "savings": "Savings is the money you keep after paying for all your needs. Think of it as leftover money you can use for fun things or for later!",
        "saving": "Saving is the act of setting aside a portion of your current income for future use. It is a crucial component of financial planning and plays a vital role in achieving financial security and long-term goals.",
        "budgeting": "Budgeting is the process of creating a plan to spend your money. This spending plan is called a budget. Creating a spending plan allows you to determine in advance whether you will have enough money to do the things you need to do or would like to do.",
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

    if message.lower() == "debt management strategies":
        return jsonify({"reply": "<b>Debt Management Strategies:</b><br><br>Here are some strategies to manage debt:<br><br><b>1. Create a Budget:</b> Track your income and expenses to find money to put towards your debt.<br><b>2. Debt Snowball Method:</b> Pay off your smallest debts first to build momentum.<br><b>3. Debt Avalanche Method:</b> Pay off your debts with the highest interest rates first to save money on interest.<br><b>4. Debt Consolidation:</b> Combine multiple debts into a single loan with a lower interest rate.<br><b>5. Seek Professional Help:</b> A credit counselor can help you create a plan to get out of debt."})

    for term, definition in financial_terms.items():
        if message.lower() == term or message.lower() == f"what is {term}":
            return jsonify({"reply": f"<b>{term.title()}:</b> {definition}<br><br>I hope you learned 😊"})

    defined_term, definition = get_definition(message)
    if definition:
        return jsonify({"reply": f"<b>{defined_term.title()}:</b> {definition}"})

    # Fallback
    return jsonify({"reply": "I'm sorry, I don't have an answer for that. I can define financial terms, or you can ask me to make a calculation."})


if __name__ == "__main__":
    app.run(debug=True, port=5001)
