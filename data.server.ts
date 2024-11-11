import { Pickaxe } from "shared/pickaxes";
import { Glowstick } from "shared/glowsticks";
import { DynamiteConstructor } from "shared/dynamite";

import glowstickHandler from "shared/glowstickHandler";
import dynamiteHandler from "shared/dynamiteHandler";

const https = game.GetService("HttpService") as HttpService;

const events = game.GetService("ReplicatedStorage").WaitForChild("Events") as Folder;
const connectMining = events.WaitForChild("ConnectMining") as RemoteEvent;

game.GetService("Players").PlayerAdded.Connect((player: Player) => {
	// set up player attributes when they join (datastores aren't implemented yet, but would be pretty easy to add with my system)
	player.SetAttribute("Money", 50);
	player.SetAttribute("Inventory", https.JSONEncode([]));
	player.SetAttribute("Pickaxes", https.JSONEncode([]));
	player.SetAttribute("Glowsticks", https.JSONEncode([]));
	player.SetAttribute("Dynamite", https.JSONEncode([]));
	player.SetAttribute("Quests", https.JSONEncode([undefined, undefined, undefined]));

	// I don't know why I put this here. I don't think it actually does anything, since you don't spawn with any tools, but I'm worried that removing it will break everything
	const characterChildren = player.Character?.GetChildren();
	for (const child of characterChildren || []) {
		if (child.IsA("Tool") && child.GetAttribute("Pickaxe")) {
			child.Destroy();
		}
	}

	player.AttributeChanged.Connect((attribute: string) => {
		// Okay, so when the Pickaxes attribute is updated, we delete all pickaxes in their Backpack and character, and add all the updated ones.
		// Probably not the best way to do it, but it works.
		if (attribute === "Pickaxes") {
			player
				.FindFirstChild("Backpack")
				?.GetChildren()
				.forEach((child) => {
					if (child.IsA("Tool") && child.GetAttribute("Pickaxe")) {
						child.Destroy();
					}
				});

			const pickaxes = https.JSONDecode(player.GetAttribute("Pickaxes") as string) as Pickaxe[];
			pickaxes.forEach((pickaxe) => {
				const newPickaxe = game.GetService("ReplicatedStorage").WaitForChild("Pickaxe").Clone() as Tool;
				newPickaxe.Parent = player.FindFirstChild("Backpack");

				newPickaxe.Name = pickaxe.displayName;
				newPickaxe.SetAttribute("Pickaxe", https.JSONEncode(pickaxe));
				const pick = newPickaxe.FindFirstChild("Pick") as MeshPart;
				pick.Material = Enum.Material[pickaxe.pickMaterial as keyof typeof Enum.Material] as Enum.Material;
				pick.Color = Color3.fromRGB(pickaxe.pickColor.r, pickaxe.pickColor.g, pickaxe.pickColor.b);
				const handle = newPickaxe.FindFirstChild("Handle") as MeshPart;
				handle.Material = Enum.Material[pickaxe.handleMaterial as keyof typeof Enum.Material] as Enum.Material;
				handle.Color = Color3.fromRGB(pickaxe.handleColor.r, pickaxe.handleColor.g, pickaxe.handleColor.b);

				connectMining.FireClient(player, newPickaxe);
			});
		// Same update system but for the Glowstick item
		} else if (attribute === "Glowsticks") {
			player
				.FindFirstChild("Backpack")
				?.GetChildren()
				.forEach((child) => {
					if (child.IsA("Tool") && child.GetAttribute("Glowstick")) {
						child.Destroy();
					}
				});

			const glowsticks = https.JSONDecode(player.GetAttribute("Glowsticks") as string) as Glowstick[];
			glowsticks.forEach((glowstick) => {
				const newGlowstick = game.GetService("ReplicatedStorage").WaitForChild("Glowstick").Clone() as Tool;
				newGlowstick.Parent = player.FindFirstChild("Backpack");

				newGlowstick.Name = glowstick.displayName;
				newGlowstick.SetAttribute("Glowstick", https.JSONEncode(glowstick));
				const handle = newGlowstick.FindFirstChild("Handle") as UnionOperation;
				handle.Color = Color3.fromRGB(glowstick.color.r, glowstick.color.g, glowstick.color.b);

				glowstickHandler(newGlowstick);
			});
		// And again but for Dynamite. (Y'know, this could probably be made into some sort of simplified function)
		} else if (attribute === "Dynamite") {
			player
				.FindFirstChild("Backpack")
				?.GetChildren()
				.forEach((child) => {
					if (child.IsA("Tool") && child.GetAttribute("Dynamite")) {
						child.Destroy();
					}
				});

			const dynamite = https.JSONDecode(player.GetAttribute("Dynamite") as string) as DynamiteConstructor[];
			dynamite.forEach((d) => {
				const newDynamite = game.GetService("ReplicatedStorage").WaitForChild("Dynamite").Clone() as Tool;
				newDynamite.Parent = player.FindFirstChild("Backpack");

				newDynamite.Name = d.displayName;
				newDynamite.SetAttribute("Dynamite", https.JSONEncode(d));

				dynamiteHandler(newDynamite);
			});
		}
	});
});
