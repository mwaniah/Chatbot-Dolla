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
        }
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