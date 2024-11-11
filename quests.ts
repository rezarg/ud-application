const https = game.GetService("HttpService") as HttpService;

// Quest constructor
class Quest {
	constructor(
		public displayName: string,
		public questDialogue: string,
		public taskDescription: string,
		public rewardDescription: string,
		public setup: (player: Player) => void,
		public progress: (player: Player, questEntry: Frame | undefined) => boolean,
		public reward: (player: Player) => void,
	) {}
}

// List of all quests for easy access. I would make it a dictionary, but it works fine how it is, and keys aren't really needed for how I use it.
const Quests: Quest[] = [];

// Add a new quest to the Quests list
Quests.push(
	new Quest(
		"Collect Stone Easy", // I called this a displayName but it doesn't actually display it anywhere, it's more of an identifier.
		"I'd pay a hefty price for 25 Stone right about now...", // This is the dialogue the Quest NPC says to you when giving the quest.
		"Collect 0/25 Stone", // This is the quest progress text
		"Reward: $50", // Quest reward text
		() => {}, // setup function (This quest doesn't require any setup to work, unlike the Playtime quest)
		(player, questEntry) => { // This function checks the progress of the quest and verifies if the user can claim the reward.
			const inventory = https.JSONDecode(player.GetAttribute("Inventory") as string) as { [key: string]: number };
			const stoneCount = inventory["Stone"] !== undefined ? inventory["Stone"] : 0;
			const complete = stoneCount >= 25;

			if (questEntry !== undefined) {
				const questTitle = questEntry.WaitForChild("QuestTitle") as TextButton;
				const questEntryTitle = questEntry.WaitForChild("QuestTitle") as TextButton;
				if (complete) {
					questEntryTitle.Text = "Claim";
					questEntryTitle.TextColor3 = Color3.fromRGB(0, 255, 0);
				} else {
					questTitle.Text = `Collect ${math.clamp(stoneCount, 0, 25)}/25 Stone`;
				}
			}

			return complete;
		},
		(player) => { // This function adds the reward to the player's data when claimed.
			const money = player.GetAttribute("Money") as number;
			player.SetAttribute("Money", money + 50);
			const inventory = https.JSONDecode(player.GetAttribute("Inventory") as string) as { [key: string]: number };
			inventory["Stone"] -= 25;
			player.SetAttribute("Inventory", https.JSONEncode(inventory));
		},
	),
);

Quests.push(
	new Quest(
		"Collect Stone Medium",
		"Oh boy, could I go for some stone... Could you get me some?",
		"Collect 0/50 Stone",
		"Reward: $200",
		() => {},
		(player, questEntry) => {
			const inventory = https.JSONDecode(player.GetAttribute("Inventory") as string) as { [key: string]: number };
			const stoneCount = inventory["Stone"] !== undefined ? inventory["Stone"] : 0;
			const complete = stoneCount >= 50;

			if (questEntry !== undefined) {
				const questEntryTitle = questEntry.WaitForChild("QuestTitle") as TextButton;
				if (complete) {
					questEntryTitle.Text = "Claim";
					questEntryTitle.TextColor3 = Color3.fromRGB(0, 255, 0);
				} else {
					questEntryTitle.Text = `Collect ${math.clamp(stoneCount, 0, 50)}/50 Stone`;
				}
			}

			return complete;
		},
		(player) => {
			const money = player.GetAttribute("Money") as number;
			player.SetAttribute("Money", money + 50);
			const inventory = https.JSONDecode(player.GetAttribute("Inventory") as string) as { [key: string]: number };
			inventory["Stone"] -= 50;
			player.SetAttribute("Inventory", https.JSONEncode(inventory));
		},
	),
);

Quests.push(
	new Quest(
		"Playtime Easy",
		"I get a bit lonely down in the mines, could you stick around for a bit?",
		"Play for 5:00",
		"Reward: $100",
		(player) => { // Here, the setup function is actually used, and it sets an attribute under the player for when the quest started.
			if (player.GetAttribute("PlaytimeEasyStart") === undefined) {
				player.SetAttribute("PlaytimeEasyStart", os.time());
			}
		},
		(player, questEntry) => {
			const startedAt = player.GetAttribute("PlaytimeEasyStart") as number;

			const timeLeft = 300 - (os.time() - startedAt);

			// I found these conversion methods on some stackoverflow post :)
			const minutesRemaining = math.floor(timeLeft / 60);
			const secondsRemainingRaw = timeLeft % 60;
			const secondsRemaining =
				tostring(secondsRemainingRaw).size() === 1 ? `0${secondsRemainingRaw}` : `${secondsRemainingRaw}`; // I figured this one out myself though 🤓

			const complete = minutesRemaining <= 0;
			if (questEntry !== undefined) {
				const questEntryTitle = questEntry.WaitForChild("QuestTitle") as TextButton;
				if (complete) {
					questEntryTitle.Text = "Claim";
					questEntryTitle.TextColor3 = Color3.fromRGB(0, 255, 0);
				} else {
					questEntryTitle.Text = `Play for ${minutesRemaining}:${secondsRemaining}`;
				}
			}

			return complete;
		},
		(player) => {
			const money = player.GetAttribute("Money") as number;
			player.SetAttribute("Money", money + 100);
			player.SetAttribute("PlaytimeEasyStart", undefined);
		},
	),
);

Quests.push(
	new Quest(
		"Collect Coal Easy",
		"I'm tryna cook up a bit of somethin', but I don't have any coal! If only someone could get me some... 👀",
		"Collect 0/15 Coal",
		"Reward: $50",
		() => {},
		(player, questEntry) => {
			const inventory = https.JSONDecode(player.GetAttribute("Inventory") as string) as { [key: string]: number };
			const count = inventory["Coal"] !== undefined ? inventory["Coal"] : 0;
			const complete = count >= 15;

			if (questEntry !== undefined) {
				const questEntryTitle = questEntry.WaitForChild("QuestTitle") as TextButton;
				if (complete) {
					questEntryTitle.Text = "Claim";
					questEntryTitle.TextColor3 = Color3.fromRGB(0, 255, 0);
				} else {
					questEntryTitle.Text = `Collect ${math.clamp(count, 0, 15)}/15 Coal`;
				}
			}

			return complete;
		},
		(player) => {
			const money = player.GetAttribute("Money") as number;
			player.SetAttribute("Money", money + 50);
			const inventory = https.JSONDecode(player.GetAttribute("Inventory") as string) as { [key: string]: number };
			inventory["Coal"] -= 15;
			player.SetAttribute("Inventory", https.JSONEncode(inventory));
		},
	),
);

Quests.push(
	new Quest(
		"Collect Copper Easy",
		"You see, I like to think of myself as a sort of... Inventor. Problem is, I'm runnin' out of copper. Do you think you could bring me some?",
		"Collect 0/10 Copper",
		"Reward: $75",
		() => {},
		(player, questEntry) => {
			const inventory = https.JSONDecode(player.GetAttribute("Inventory") as string) as { [key: string]: number };
			const count = inventory["Copper"] !== undefined ? inventory["Copper"] : 0;
			const complete = count >= 10;

			if (questEntry !== undefined) {
				const questEntryTitle = questEntry.WaitForChild("QuestTitle") as TextButton;
				if (complete) {
					questEntryTitle.Text = "Claim";
					questEntryTitle.TextColor3 = Color3.fromRGB(0, 255, 0);
				} else {
					questEntryTitle.Text = `Collect ${math.clamp(count, 0, 10)}/10 Copper`;
				}
			}

			return complete;
		},
		(player) => {
			const money = player.GetAttribute("Money") as number;
			player.SetAttribute("Money", money + 75);
			const inventory = https.JSONDecode(player.GetAttribute("Inventory") as string) as { [key: string]: number };
			inventory["Copper"] -= 10;
			player.SetAttribute("Inventory", https.JSONEncode(inventory));
		},
	),
);

export { Quests, Quest }; // Export Quests list and Quest class for types.
