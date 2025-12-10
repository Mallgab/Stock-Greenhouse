export class QuestUI {
    constructor(gameState) {
        this.gameState = gameState;
        this.questPanel = document.getElementById('quest-ui');
        this.questListContainer = document.getElementById('quest-list');

        this.questPanel.style.display = 'none'; // Hidden by default

        this.setupEventListeners();
    }

    setupEventListeners() {
        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape') {
                this.hide();
            }
        });
    }

    show() {
        this.questPanel.style.display = 'flex';
    }

    hide() {
        this.questPanel.style.display = 'none';
    }

    updateQuestList(quests) {
        this.questListContainer.innerHTML = ''; // Clear previous quests

        if (quests.length === 0) {
            const listItem = document.createElement('li');
            listItem.textContent = "No active quests.";
            this.questListContainer.appendChild(listItem);
            return;
        }

        quests.forEach(quest => {
            const listItem = document.createElement('li');
            let statusText = "";
            if (quest.completed) {
                statusText = "(Completed)";
                listItem.style.color = 'lightgreen';
            } else if (quest.active) {
                statusText = "(Active)";
                listItem.style.color = 'white';
            } else {
                statusText = "(Locked)";
                listItem.style.color = 'gray';
            }
            listItem.textContent = `${quest.description} ${statusText}`;
            this.questListContainer.appendChild(listItem);
        });
    }
}
