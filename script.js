document.addEventListener('DOMContentLoaded', () => {
    const chatMessages = document.getElementById('chat-messages');
    const chatInput = document.getElementById('chat-input');
    const sendButton = document.getElementById('send-button');
    const allowanceInput = document.getElementById('allowance-input');
    const expensesInput = document.getElementById('expenses-input');
    const typingIndicator = document.querySelector('.typing-indicator-container');
    const buttonContainer = document.createElement('div');
    buttonContainer.classList.add('button-container');
    chatMessages.appendChild(buttonContainer);

    let conversationState = 'start';
    let budgetData = {};

    const addMessage = (message, sender, buttons = []) => {
        const messageElement = document.createElement('div');
        messageElement.classList.add('message', sender === 'user' ? 'user-message' : 'bot-message');
        messageElement.innerHTML = message;
        chatMessages.insertBefore(messageElement, buttonContainer);
        chatMessages.scrollTop = chatMessages.scrollHeight;

        buttonContainer.innerHTML = '';
        if (buttons.length > 0) {
            buttons.forEach(buttonText => {
                const button = document.createElement('button');
                button.textContent = buttonText;
                button.addEventListener('click', () => handleButtonClick(buttonText));
                buttonContainer.appendChild(button);
            });
        }
    };

    const showTypingIndicator = () => {
        typingIndicator.style.display = 'flex';
        chatMessages.scrollTop = chatMessages.scrollHeight;
    };

    const hideTypingIndicator = () => {
        typingIndicator.style.display = 'none';
    };

    const handleButtonClick = (buttonText) => {
        addMessage(buttonText, 'user');
        if (conversationState === 'start' && buttonText === 'Yes') {
            conversationState = 'ask_student';
            budgetData.allowance = parseFloat(allowanceInput.value);
            budgetData.expenses = parseFloat(expensesInput.value);
            addMessage("Great! Let's create a budget plan for you. Are you a student?", 'bot', ['Yes', 'No']);
        } else if (conversationState === 'start' && buttonText === 'No') {
            addMessage("Alright. If you change your mind, just let me know.", 'bot');
            conversationState = 'start';
        } else if (conversationState === 'ask_student' && buttonText === 'Yes') {
            conversationState = 'ask_transport';
            addMessage("What is your primary mode of transport?", 'bot', ['Walking', 'Public Transport', 'Personal Car']);
        } else if (conversationState === 'ask_student' && buttonText === 'No') {
            conversationState = 'ask_work';
            addMessage("Do you work?", 'bot', ['Yes', 'No']);
        } else if (conversationState === 'ask_transport') {
            budgetData.transportMode = buttonText;
            conversationState = 'ask_food_habits';
            addMessage("What are your typical food habits?", 'bot', ['Cook at home', 'Eat at school cafeteria', 'Order takeout']);
        } else if (conversationState === 'ask_food_habits') {
            budgetData.foodHabit = buttonText;
            createStudentBudgetPlan();
        } else if (conversationState === 'ask_work' && buttonText === 'Yes') {
            createWorkerBudgetPlan();
        } else if (conversationState === 'ask_work' && buttonText === 'No') {
            addMessage("I can only create budget plans for students or workers at the moment.", 'bot');
            conversationState = 'start';
        } else if (conversationState === 'ask_employment_status') {
            budgetData.employmentStatus = buttonText;
            conversationState = 'ask_income_level';
            addMessage('Got it. Now, what is your current income level?', 'bot', ['Low Income', 'Medium Income', 'High Income']);
        } else if (conversationState === 'ask_income_level') {
            budgetData.incomeLevel = buttonText;
            provideBudgetingAdvice(budgetData.employmentStatus, budgetData.incomeLevel);
        }
    };

    const provideBudgetingAdvice = (employmentStatus, incomeLevel) => {
        let advice = '';
        let title = `Budgeting Tips for a ${employmentStatus} with ${incomeLevel} Income`;

        let tips = [];

        if (employmentStatus === 'Student') {
            if (incomeLevel === 'Low Income') {
                tips = [
                    "<b>Track your spending:</b> Know where your money goes.",
                    "<b>Student discounts are your best friend:</b> Always ask if there's a student discount.",
                    "<b>Cook your own meals:</b> It's cheaper and healthier than eating out.",
                    "<b>Look for part-time work or paid internships:</b> A little extra income can make a big difference.",
                    "<b>Use public transport or walk:</b> Avoid the costs of a personal car."
                ];
            } else if (incomeLevel === 'Medium Income') {
                tips = [
                    "<b>Create a budget and stick to it:</b> The 50/30/20 rule is a good start.",
                    "<b>Save a portion of your allowance/income:</b> Start building a savings habit early.",
                    "<b>Avoid unnecessary subscriptions:</b> Do you really need all those streaming services?",
                    "<b>Plan for your future:</b> It's never too early to start thinking about long-term goals.",
                    "<b>Invest in your education:</b> Use your resources to learn new skills."
                ];
            } else { // High Income
                tips = [
                    "<b>Start investing early:</b> Take advantage of compound interest.",
                    "<b>Build an emergency fund:</b> Be prepared for unexpected expenses.",
                    "<b>Avoid lifestyle inflation:</b> Don't increase your spending just because your income has increased.",
                    "<b>Seek financial advice:</b> Learn how to manage your money effectively.",
                    "<b>Give back:</b> Consider donating to a cause you care about."
                ];
            }
        } else if (employmentStatus === 'Worker') {
             if (incomeLevel === 'Low Income') {
                tips = [
                    "<b>Create a detailed budget:</b> Track every dollar.",
                    "<b>Cut unnecessary expenses:</b> Look for areas where you can save.",
                    "<b>Increase your income:</b> Consider a side hustle or asking for a raise.",
                    "<b>Build an emergency fund:</b> Even a small one can help.",
                    "<b>Avoid debt:</b> It can be a major obstacle to financial freedom."
                ];
            } else if (incomeLevel === 'Medium Income') {
                tips = [
                    "<b>Automate your savings and investments:</b> Make it a priority.",
                    "<b>Pay off high-interest debt:</b> This will free up more of your income.",
                    "<b>Plan for retirement:</b> Take advantage of employer-sponsored retirement plans.",
                    "<b>Review your insurance coverage:</b> Make sure you're adequately protected.",
                    "<b>Set financial goals:</b> This will help you stay motivated."
                ];
            } else { // High Income
                tips = [
                    "<b>Max out your retirement contributions:</b> This is a great way to save for the future.",
                    "<b>Diversify your investments:</b> Don't put all your eggs in one basket.",
                    "<b>Work with a financial advisor:</b> Get expert help to manage your wealth.",
                    "<b>Optimize your taxes:</b> Look for ways to reduce your tax burden.",
                    "<b>Plan your estate:</b> Protect your assets and provide for your loved ones."
                ];
            }
        } else { // Unemployed
            title = `Budgeting Tips for an Unemployed Individual`;
            if (incomeLevel === 'Low Income') {
                tips = [
                    "<b>Create a bare-bones budget:</b> Focus on essential expenses only.",
                    "<b>Apply for unemployment benefits:</b> This can provide a temporary safety net.",
                    "<b>Cut all non-essential spending:</b> Be ruthless.",
                    "<b>Seek out community resources:</b> There may be programs that can help with food, housing, and other needs.",
                    "<b>Focus on finding a new job:</b> This is your top priority."
                ];
            } else if (incomeLevel === 'Medium Income') {
                tips = [
                    "<b>Review your emergency fund:</b> This is what it's for.",
                    "<b>Create a new budget based on your current situation:</b> Your income has changed, so your budget needs to change too.",
                    "<b>Negotiate with your creditors:</b> They may be willing to work with you.",
                    "<b>Network and upskill:</b> Use this time to improve your job prospects.",
                    "<b>Stay positive:</b> A positive attitude can make a big difference."
                ];
            } else { // High Income
                tips = [
                    "<b>Don't panic:</b> You have resources to draw on.",
                    "<b>Assess your financial situation:</b> Know where you stand.",
                    "<b>Create a plan for the next few months:</b> This will help you feel more in control.",
                    "<b>Consider consulting with a financial advisor:</b> They can help you navigate this transition.",
                    "<b>Take care of yourself:</b> Job loss can be stressful, so make sure to prioritize your well-being."
                ];
            }
        }

        advice = `<h3>${title}:</h3><ul>` + tips.map(tip => `<li>${tip}</li>`).join('') + `</ul>`;
        addMessage(advice, 'bot');
        conversationState = 'start';
        budgetData = {}; // Clear budget data
    };

    const provideSavingTips = () => {
        const tips = [
            "<b>Pay yourself first:</b> Set aside a portion of your income for savings before you start spending.",
            "<b>Automate your savings:</b> Set up automatic transfers to your savings account.",
            "<b>Create a budget:</b> This will help you track your spending and find areas where you can save.",
            "<b>Cut back on unnecessary expenses:</b> Look for ways to reduce your spending on non-essential items.",
            "<b>Set savings goals:</b> This will help you stay motivated and focused on your financial goals."
        ];

        const advice = `<h3>Here are some general saving tips:</h3><ul>` + tips.map(tip => `<li>${tip}</li>`).join('') + `</ul>`;
        addMessage(advice, 'bot');
    };

    const provideDebtManagementTips = () => {
        const tips = [
            "<b>Assess your debt:</b> Know how much you owe and to whom.",
            "<b>Create a budget:</b> This will help you find money to put towards your debt.",
            "<b>Choose a repayment strategy:</b> The two most common are the debt snowball and debt avalanche methods.",
            "<b>Consider debt consolidation:</b> This could simplify your payments and lower your interest rate.",
            "<b>Seek professional help:</b> A credit counselor can help you create a plan to get out of debt."
        ];

        const advice = `<h3>Here are some debt management strategies:</h3><ul>` + tips.map(tip => `<li>${tip}</li>`).join('') + `</ul>`;
        addMessage(advice, 'bot');
    };

    const createStudentBudgetPlan = () => {
        const allowance = budgetData.allowance || 0;
        const expenses = budgetData.expenses || 0;

        let transportPercentage = 0;
        let foodPercentage = 0;

        // Determine transport percentage
        switch (budgetData.transportMode) {
            case 'Walking':
                transportPercentage = 0.05;
                break;
            case 'Public Transport':
                transportPercentage = 0.15;
                break;
            case 'Personal Car':
                transportPercentage = 0.30;
                break;
        }

        // Determine food percentage
        switch (budgetData.foodHabit) {
            case 'Cook at home':
                foodPercentage = 0.30;
                break;
            case 'Eat at school cafeteria':
                foodPercentage = 0.40;
                break;
            case 'Order takeout':
                foodPercentage = 0.50;
                break;
        }

        const otherPercentage = 1.0 - transportPercentage - foodPercentage;

        const transportCosts = expenses * transportPercentage;
        const foodCosts = expenses * foodPercentage;
        const otherCosts = expenses * otherPercentage;
        const savings = allowance - expenses;

        const budgetPlan = `
            <h3>Here is a sample budget plan for a student:</h3>
            <p><b>Your Allowance:</b> Ksh${allowance}</p>
            <p><b>Your Total Expenses:</b> Ksh${expenses.toFixed(2)}</p>
            <hr>
            <p><b>Suggested Expense Breakdown:</b></p>
            <p><b>Transport:</b> Ksh${transportCosts.toFixed(2)}</p>
            <p><b>Food:</b> Ksh${foodCosts.toFixed(2)}</p>
            <p><b>Other:</b> Ksh${otherCosts.toFixed(2)}</p>
            <hr>
            <p><b>Estimated Savings:</b> Ksh${savings.toFixed(2)}</p>
            <br>
            <p>This is a basic plan. You can adjust it based on your actual spending.</p>
        `;
        addMessage(budgetPlan, 'bot');

        if (expenses > allowance) {
            addMessage('You spend more than you earn. Try to reduce your data and snack costs.', 'bot');
        }

        allowanceInput.value = '';
        expensesInput.value = '';
        conversationState = 'start';
    };

    const createWorkerBudgetPlan = () => {
        const allowance = budgetData.allowance || 0;
        const expenses = budgetData.expenses || 0;

        const transportPercentage = 0.4;
        const foodPercentage = 0.3;
        const otherPercentage = 0.3;

        const transportCosts = expenses * transportPercentage;
        const foodCosts = expenses * foodPercentage;
        const otherCosts = expenses * otherPercentage;

        const savings = allowance - expenses;

        const budgetPlan = `
            <h3>Here is a suggested budget plan for a worker:</h3>
            <p><b>Your Allowance:</b> Ksh${allowance}</p>
            <p><b>Your Total Expenses:</b> Ksh${expenses}</p>
            <hr>
            <p><b>Suggested Expense Breakdown:</b></p>
            <p><b>Transport (40%):</b> Ksh${transportCosts.toFixed(2)}</p>
            <p><b>Food (30%):</b> Ksh${foodCosts.toFixed(2)}</p>
            <p><b>Other (30%):</b> Ksh${otherCosts.toFixed(2)}</p>
            <hr>
            <p><b>Estimated Savings:</b> Ksh${savings.toFixed(2)}</p>
            <br>
            <p>This is a guideline. You can adjust the percentages based on your needs.</p>
        `;
        addMessage(budgetPlan, 'bot');

        if (expenses > allowance) {
            addMessage('You spend more than you earn. Try to reduce your data and snack costs.', 'bot');
        }

        allowanceInput.value = '';
        expensesInput.value = '';
        conversationState = 'start';
    };

    const sendMessage = async () => {
        const message = chatInput.value.trim();
        const allowance = allowanceInput.value;
        const expenses = expensesInput.value;

        if (message.toLowerCase() === 'clear') {
            chatMessages.innerHTML = '';
            chatInput.value = '';
            allowanceInput.value = '';
            expensesInput.value = '';
            chatMessages.appendChild(buttonContainer);
            return;
        }

        const lowerCaseMessage = message.toLowerCase();
        if (lowerCaseMessage.includes('budgeting tips')) {
            addMessage(message, 'user');
            chatInput.value = '';
            conversationState = 'ask_employment_status';
            addMessage('Of course! To give you the best advice, could you tell me your current employment status?', 'bot', ['Student', 'Worker', 'Unemployed']);
            return;
        }

        if (lowerCaseMessage.includes('saving tips')) {
            addMessage(message, 'user');
            chatInput.value = '';
            provideSavingTips();
            return;
        }

        if (lowerCaseMessage.includes('thank you') || lowerCaseMessage.includes('thanks')) {
            addMessage(message, 'user');
            chatInput.value = '';
            addMessage('Thank my creators instead, the amazing team 3: <b>Delphine, Tendai and Diana</b>. Buy them food! 😂', 'bot');
            return;
        }

        if (lowerCaseMessage.includes('baddie')) {
            addMessage(message, 'user');
            chatInput.value = '';
            addMessage('Yes, a baddie with a body! ❤️', 'bot');
            return;
        }

        if (message === '' && (allowance === '' || expenses === '')) return;

        let userMessage = message;
        if (allowance && expenses && !message) {
            userMessage = `Calculate savings with allowance: ${allowance} and expenses: ${expenses}`;
        }

        if (userMessage) {
            addMessage(userMessage, 'user');
        }
        
        chatInput.value = '';
        showTypingIndicator();

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ message: userMessage, allowance, expenses }),
            });

            if (!response.ok) {
                throw new Error('Network response was not ok');
            }

            const data = await response.json();
            hideTypingIndicator();
            addMessage(data.reply, 'bot', data.buttons);
        } catch (error) {
            console.error('Error sending message:', error);
            hideTypingIndicator();
            addMessage("I'm still under development and learning new things every day. I can't answer that right now, but I'm working on it!", 'bot');
        }
    };

    sendButton.addEventListener('click', sendMessage);
    chatInput.addEventListener('keypress', (event) => {
        if (event.key === 'Enter') {
            sendMessage();
        }
    });

    // Create falling leaves
    const leavesContainer = document.getElementById('leaves-container');
    setInterval(() => {
        const leaf = document.createElement('div');
        leaf.classList.add('leaf');
        leaf.style.left = `${Math.random() * 100}vw`;
        leaf.style.animationDuration = `${Math.random() * 5 + 5}s`; // 5-10 seconds
        leavesContainer.appendChild(leaf);

        setTimeout(() => {
            leaf.remove();
        }, 10000); // Remove leaf after 10 seconds
    }, 500); // Create a new leaf every 500ms
});