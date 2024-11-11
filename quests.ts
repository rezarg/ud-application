const https = game.GetService("HttpService") as HttpService;

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

const Quests: Quest[] = [];

Quests.push(
	new Quest(
		"Collect Stone Easy",
		"I'd pay a hefty price for 25 Stone right about now...",
		"Collect 0/25 Stone",
		"Reward: $50",
		() => {},
		(player, questEntry) => {
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
		(player) => {
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
		(player) => {
			if (player.GetAttribute("PlaytimeEasyStart") === undefined) {
				player.SetAttribute("PlaytimeEasyStart", os.time());
			}
		},
		(player, questEntry) => {
			const startedAt = player.GetAttribute("PlaytimeEasyStart") as number;

			const timeLeft = 300 - (os.time() - startedAt);

			const minutesRemaining = math.floor(timeLeft / 60);
			const secondsRemainingRaw = timeLeft % 60;
			const secondsRemaining =
				tostring(secondsRemainingRaw).size() === 1 ? `0${secondsRemainingRaw}` : `${secondsRemainingRaw}`;

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

export { Quests, Quest };
