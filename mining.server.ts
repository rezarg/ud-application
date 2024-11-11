import { Pickaxe } from "shared/pickaxes";
import { Blocks, Block } from "shared/blocks";

import Object from "@rbxts/object-utils";
import rng from "shared/rng";

const https = game.GetService("HttpService") as HttpService;

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

function randomBlock() {
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

function generateBlock(blockType: Block, position: Vector3) {
	let canGenerate = true;

	noGenZones.GetChildren().forEach((v) => {
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

	const chunkX = math.floor(position.X / (3 * 16));
	const chunkY = math.floor(position.Y / (3 * 16));
	const chunkZ = math.floor(position.Z / (3 * 16));

	const chunkIdentifier = `x${chunkX}y${chunkY}z${chunkZ}`;
	let chunkContainer;

	if (mineContainer.FindFirstChild(chunkIdentifier)) {
		chunkContainer = mineContainer.FindFirstChild(chunkIdentifier) as Folder;
	} else {
		chunkContainer = new Instance("Folder");
		chunkContainer.Name = chunkIdentifier;
		chunkContainer.Parent = mineContainer;
	}

	const newBlock = blockTemplate.Clone();

	newBlock.Position = position;
	newBlock.Size = blockSize;
	newBlock.Material = Enum.Material[blockType.material as keyof typeof Enum.Material] as Enum.Material;
	newBlock.Color = Color3.fromRGB(blockType.color.r, blockType.color.g, blockType.color.b);
	newBlock.SetAttribute("block", https.JSONEncode(blockType));
	newBlock.SetAttribute("hp", blockType.hp);
	newBlock.SetAttribute("defhp", blockType.hp);

	if (blockType.oreMaterial !== undefined && blockType.oreColor !== undefined) {
		const newOre = oreTemplate.Clone();

		newOre.Position = position;
		newOre.Material = Enum.Material[blockType.oreMaterial as keyof typeof Enum.Material] as Enum.Material;
		newOre.Color = Color3.fromRGB(blockType.oreColor.r, blockType.oreColor.g, blockType.oreColor.b);
		newOre.Parent = newBlock;
	}

	newBlock.Parent = chunkContainer;
	currentBlocks.push(newBlock.Position);
}

function damageBlockHandler(player: Player, damage: number, targetBlock: Part) {
	const blockType = https.JSONDecode(targetBlock.GetAttribute("block") as string) as Block;

	if (blockType.unbreakable) {
		return;
	}

	let hp = targetBlock.GetAttribute("hp") as number;
	hp -= damage;
	targetBlock.SetAttribute("hp", hp);

	if (hp <= 0) {
		minedBlocks.push(targetBlock.Position);

		const origin = targetBlock.Position;

		for (let x = -1; x <= 1; x++) {
			for (let y = -1; y <= 1; y++) {
				for (let z = -1; z <= 1; z++) {
					if (x === 0 && y === 0 && z === 0) {
						continue;
					}

					const newPos = origin.add(new Vector3(x, y, z).mul(blockSize));
					if (minedBlocks.find((pos) => pos === newPos)) {
						continue;
					}

					if (currentBlocks.find((pos) => pos === newPos)) {
						continue;
					}

					// Don't generate if it's in spawn
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

					generateBlock(randomBlock(), newPos);
				}
			}
		}

		const inventory = https.JSONDecode(player.GetAttribute("Inventory") as string) as { [key: string]: number };

		const blockKey = Object.keys(Blocks).find((key) => Blocks[key].displayName === blockType.displayName) as string;

		if (Object.keys(inventory).find((key) => key === blockKey) !== undefined) {
			inventory[blockKey] += 1;
		} else {
			inventory[blockKey] = 1;
		}

		player.SetAttribute("Inventory", https.JSONEncode(inventory));

		targetBlock.Destroy();
		getBlock.FireClient(player);
	}
}

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

damageBlockBind.Event.Connect((player: Player, pickaxe: unknown, block: unknown) => {
	if (!typeIs(block, "Instance") || !typeIs(pickaxe, typeOf(Pickaxe))) {
		return;
	}

	const targetBlock = block as Part;
	const userPickaxe = pickaxe as Pickaxe;

	const inventory = https.JSONDecode(player.GetAttribute("Pickaxes") as string) as Pickaxe[];
	if (
		!inventory.find((x) => userPickaxe.displayName === x.displayName) &&
		userPickaxe.displayName !== "Dynamite Damage"
	) {
		return;
	}

	if (targetBlock.Parent?.Parent !== mineContainer) {
		return;
	}

	damageBlockHandler(player, userPickaxe.damage, targetBlock);
});
