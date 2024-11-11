import { Pickaxe } from "shared/pickaxes"; // Import Pickaxe class
import { Blocks, Block } from "shared/blocks"; // Import Blocks dict and Block class

import Object from "@rbxts/object-utils";

/*
	rng module I made, it's pretty nifty if I do say so myself ;)
 	it takes in a table of chances and gives a result, as well as a "1 in x" option,
  		like how RNG games such as Sol's RNG have, where it says "1 in 1,000!!!!"
*/
import rng from "shared/rng";

const https = game.GetService("HttpService") as HttpService;

// I'm not commenting all of these
const events = game.GetService("ReplicatedStorage").WaitForChild("Events") as Folder;
const damageBlock = events.WaitForChild("DamageBlock") as RemoteEvent;
const damageBlockBind = events.WaitForChild("DamageBlockBind") as BindableEvent;
const pushCurrentBlocks = events.WaitForChild("PushCurrentBlocks") as BindableEvent;
const getBlock = events.WaitForChild("GetBlock") as RemoteEvent;

const blockTemplate = game.GetService("ReplicatedStorage").WaitForChild("DefaultMesh") as MeshPart;
const oreTemplate = game.GetService("ReplicatedStorage").WaitForChild("OreMesh") as UnionOperation;
const mineContainer = game.Workspace.WaitForChild("Mine") as Folder;
const noGenZones = game.Workspace.WaitForChild("NoGenZones") as Folder;

const blockSize = new Vector3(3, 3, 3);
const minedBlocks = [] as Vector3[];
const currentBlocks = [] as Vector3[];

pushCurrentBlocks.Event.Connect((pos: Vector3) => {
	currentBlocks.push(pos);
});

function randomBlock() { // Returns a random block 🤯 using my RNG module
	const blockMultipliers: { [key: string]: number } = {};
	Object.keys(Blocks).forEach((key) => {
		const block = Blocks[key] as Block;
		if (block.spawnable) {
			blockMultipliers[key] = block.rarity;
		}
	});

	const random = rng.get(blockMultipliers);
	return Blocks[random.key] as Block;
}

function generateBlock(blockType: Block, position: Vector3) { // Makes a new game object based on the Block info and position passed in.
	let canGenerate = true;

	noGenZones.GetChildren().forEach((v) => { // This will check if it's in a "No Gen" zone (such as the spawn area) and prevents it from placing a block.
		const zone = v as Part;

		const x1 = zone.Position.X - zone.Size.X / 2;
		const x2 = zone.Position.X + zone.Size.X / 2;
		const y1 = zone.Position.Y - zone.Size.Y / 2;
		const y2 = zone.Position.Y + zone.Size.Y / 2;
		const z1 = zone.Position.Z - zone.Size.Z / 2;
		const z2 = zone.Position.Z + zone.Size.Z / 2;

		if (
			position.X >= x1 &&
			position.X <= x2 &&
			position.Y >= y1 &&
			position.Y <= y2 &&
			position.Z >= z1 &&
			position.Z <= z2
		) {
			canGenerate = false;
			return;
		}
	});

	if (!canGenerate) {
		return;
	}

	// Get chunk coordinates
	const chunkX = math.floor(position.X / (3 * 16));
	const chunkY = math.floor(position.Y / (3 * 16));
	const chunkZ = math.floor(position.Z / (3 * 16));

	const chunkIdentifier = `x${chunkX}y${chunkY}z${chunkZ}`; // Chunk ID, such as x4y2z-3
	let chunkContainer;

	// chunkContainer will be a folder in the mineContainer, and if it's not found (we're in a new chunk), we make a new folder.
	if (mineContainer.FindFirstChild(chunkIdentifier)) {
		chunkContainer = mineContainer.FindFirstChild(chunkIdentifier) as Folder;
	} else {
		chunkContainer = new Instance("Folder");
		chunkContainer.Name = chunkIdentifier;
		chunkContainer.Parent = mineContainer;
	}

	const newBlock = blockTemplate.Clone(); // blockTemplate is a Mesh I made in blender

	// This just applies all the information from the Block class that was passed in
	newBlock.Position = position;
	newBlock.Size = blockSize;
	newBlock.Material = Enum.Material[blockType.material as keyof typeof Enum.Material] as Enum.Material;
	newBlock.Color = Color3.fromRGB(blockType.color.r, blockType.color.g, blockType.color.b);
	newBlock.SetAttribute("block", https.JSONEncode(blockType));
	newBlock.SetAttribute("hp", blockType.hp);
	newBlock.SetAttribute("defhp", blockType.hp);

	// If the blockType has an oreMaterial and an oreColor then add the ore mesh on top of the block and add it's properties.
	if (blockType.oreMaterial !== undefined && blockType.oreColor !== undefined) {
		const newOre = oreTemplate.Clone();

		newOre.Position = position;
		newOre.Material = Enum.Material[blockType.oreMaterial as keyof typeof Enum.Material] as Enum.Material;
		newOre.Color = Color3.fromRGB(blockType.oreColor.r, blockType.oreColor.g, blockType.oreColor.b);
		newOre.Parent = newBlock;
	}

	newBlock.Parent = chunkContainer;
	currentBlocks.push(newBlock.Position); // This adds the block's position to the currentBlocks list, so it never generates a block where a block already is/was.
}

// I don't want to comment this but I will 😔
// But first, I wanna state: I'm not sure why I made minedBlocks and currentBlocks separate. iirc, they're both used in the same way, and could probably just be one list.
function damageBlockHandler(player: Player, damage: number, targetBlock: Part) {
	const blockType = https.JSONDecode(targetBlock.GetAttribute("block") as string) as Block; // Okay so this converts the block's class attribute into an actual Block class for typing.

	if (blockType.unbreakable) {
		return; // Just stop the damage function if it can't be damaged. Pretty obvious
	}

	// Apply the damage
	let hp = targetBlock.GetAttribute("hp") as number;
	hp -= damage;
	targetBlock.SetAttribute("hp", hp);

	if (hp <= 0) { // If the block should be broken
		minedBlocks.push(targetBlock.Position); // Add the position to mined blocks

		const origin = targetBlock.Position;

		for (let x = -1; x <= 1; x++) {
			for (let y = -1; y <= 1; y++) {
				for (let z = -1; z <= 1; z++) {
					if (x === 0 && y === 0 && z === 0) { // Loop through the 3x3 area surrounding the block (except the block itself)
						continue;
					}

					const newPos = origin.add(new Vector3(x, y, z).mul(blockSize));
					if (minedBlocks.find((pos) => pos === newPos)) {
						continue; // If there used to be a block here, don't place
					}

					if (currentBlocks.find((pos) => pos === newPos)) {
						continue; // If there's already a block here, don't place
					}

					// Don't generate if it's in spawn
					// This is hardcoded, but now I have a NoGenZone system you saw earlier, so this could be completely removed.
					if (
						newPos.X > -11.5 &&
						newPos.X < 11.5 &&
						newPos.Y > 1 &&
						newPos.Y < 12 &&
						newPos.Z > -16 &&
						newPos.Z < 16
					) {
						continue;
					}

					generateBlock(randomBlock(), newPos); // Finally, if we pass all the checks, generate the block.
				}
			}
		}

		// Now that we generated all the new blocks, we can add the mined block into the user's inventory.
		// i.e. if they mined Stone, we add 1 stone to their inventory, and would change ["Stone":1,"Coal":3] to ["Stone":2,"Coal":3]
		const inventory = https.JSONDecode(player.GetAttribute("Inventory") as string) as { [key: string]: number };

		/* long expression that converts the blockType into a Block class
		   I can't use the same method as earlier, since this needs to load the functions inside the Block, which
			are omitted from the attribute when HTTPEncode is ran, so I have to get the displayName, and find
		 	the full Block class.
    		*/
		const blockKey = Object.keys(Blocks).find((key) => Blocks[key].displayName === blockType.displayName) as string;

		if (Object.keys(inventory).find((key) => key === blockKey) !== undefined) {
			inventory[blockKey] += 1; // If the user has a counter for this block, add 1
		} else {
			inventory[blockKey] = 1; // If not, instantiate a new counter with a value of 1.
		}

		player.SetAttribute("Inventory", https.JSONEncode(inventory)); // Save their inventory

		targetBlock.Destroy();
		getBlock.FireClient(player);
	}
}

// This handles calling damageBlockHandler for when a client breaks a block.
damageBlock.OnServerEvent.Connect((player: Player, pickaxe: unknown, block: unknown) => {
	if (!typeIs(block, "Instance") || !typeIs(pickaxe, typeOf(Pickaxe))) {
		return;
	}

	const targetBlock = block as Part;
	const userPickaxe = pickaxe as Pickaxe;

	const inventory = https.JSONDecode(player.GetAttribute("Pickaxes") as string) as Pickaxe[];
	if (!inventory.find((x) => userPickaxe.displayName === x.displayName)) {
		return;
	}

	if (targetBlock.Parent?.Parent !== mineContainer) {
		return;
	}

	damageBlockHandler(player, userPickaxe.damage, targetBlock);
});

// This handles calling damageBlockHandler for when the server wants to break a block.
damageBlockBind.Event.Connect((player: Player, pickaxe: unknown, block: unknown) => {
	if (!typeIs(block, "Instance") || !typeIs(pickaxe, typeOf(Pickaxe))) {
		return;
	}

	const targetBlock = block as Part;
	const userPickaxe = pickaxe as Pickaxe;

	const inventory = https.JSONDecode(player.GetAttribute("Pickaxes") as string) as Pickaxe[];
	if (
		!inventory.find((x) => userPickaxe.displayName === x.displayName) &&
		userPickaxe.displayName !== "Dynamite Damage" // The server handler only has this one check, since Dynamite is sneakily disguised as a server-sided pickaxe >:)
		// This acts as a sort of anti-cheat, since the Dynamite Damage pickaxe isn't ownable, that means exploiters could fire the server event for damaging a block and
		// say they used the Dynamite Damage. But instead, clients can't call dynamite damage, only the server, and the client handler checks if you own a pickaxe
		// before damaging anything. I think it works okay, but there's probably some way to get around it still
	) {
		return;
	}

	if (targetBlock.Parent?.Parent !== mineContainer) {
		return;
	}

	damageBlockHandler(player, userPickaxe.damage, targetBlock);
});
