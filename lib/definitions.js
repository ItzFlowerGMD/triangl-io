const definitions = {}
	definitions.food = {
		shape: [0, 0],
		type: "food",
		name: "",
		team: 0,
		facing_type: "rotateWithSpeed",
		draw_health: true,
		fov: 2,
		guns: [],
		turrets: []
	}
	definitions.pinkFood = {
		parent: "food",
		label: "",
		color: "pink",
		size: 5,
		max_health: 2,
		score: 5,
		body: {
			accel: 0.0003,
			friction: 0.99,
			maxSpeed: Infinity,
			damage: 0,
			regen: 0,
			pushresistance: 0.1,
			pushforce: 0.1
		}
	}
	definitions.orangeFood = {
		parent: "food",
		label: "",
		shape: [4, 0],
		color: "orange",
		size: 8,
		max_health: 5,
		score: 25,
		body: {
			accel: 0.0002,
			friction: 0.99,
			maxSpeed: Infinity,
			damage: 0,
			regen: 0,
			pushresistance: 0.1,
			pushforce: 0.1
		}
	}
	definitions.greenFood = {
		parent: "food",
		label: "",
		shape: [3, 0],
		color: "green",
		size: 8,
		max_health: 9,
		score: 75,
		body: {
			accel: 0.0001,
			friction: 0.99,
			maxSpeed: Infinity,
			damage: 0,
			regen: 0,
			pushresistance: 0.1,
			pushforce: 0.1
		}
	}
	definitions.bullet = {
		shape: [3, 0],
		type: "bullet",
		label: "",
		name: "",
		color: "blue",
		max_health: 20,
		lifetime: 1000,
		draw_health: false,
		facing_type: "rotateWithSpeed",
		fov: 2,
		body: {
			accel: 0,
			friction: 1,
			maxSpeed: Infinity,
			damage: 0,
			regen: 0,
			pushresistance: 0.3,
			pushforce: 0.07
		}
	}
	definitions.block = {
		shape: [-4, 0],
		type: "block",
		label: "",
		name: "",
		color: "blue",
		max_health: 27,
		lifetime: 10000,
		draw_health: false,
		facing_type: "rotateWithSpeed",
		fov: 2,
		body: {
			accel: 0,
			friction: 0.95,
			maxSpeed: Infinity,
			damage: 0,
			regen: 0,
			pushresistance: 0.05,
			pushforce: 0.002
		}
	}
	definitions.trap = {
		shape: [-3, 0],
		type: "trap",
		label: "",
		name: "",
		color: "blue",
		max_health: 20,
		lifetime: 8000,
		draw_health: false,
		facing_type: "rotateWithSpeed",
		fov: 2,
		body: {
			accel: 0,
			friction: 0.99,
			maxSpeed: Infinity,
			damage: 0,
			regen: 0,
			pushresistance: 0.05,
			pushforce: 0.002
		}
	}
	definitions.drone = {
		shape: [3, 0],
		type: "drone",
		label: "",
		name: "",
		color: "grey",
		max_health: 15,
		lifetime: Infinity,
		draw_health: false,
		facing_type: "snapToSpeed",
		fov: 2,
		body: {
			accel: 0.0006,
			friction: 0.995,
			maxSpeed: Infinity,
			damage: 2,
			regen: 0,
			pushresistance: 0.01,
			pushforce: 0.06
		}
	}
	definitions.droneWithAGun = {
		shape: [3, Math.PI],
		type: "drone",
		label: "",
		name: "",
		color: "grey",
		max_health: 15,
		lifetime: Infinity,
		draw_health: false,
		facing_type: "snap",
		fov: 2,
		body: {
			accel: 0.0006,
			friction: 0.995,
			maxSpeed: Infinity,
			damage: 2,
			regen: 0,
			pushresistance: 0.01,
			pushforce: 0.06
		},
		guns: [
			{
				length: 0.7,
				width: 0.65,
				aspect: 0,
				offsetX: 0.7,
				offsetY: 0,
				offsetRot: 0,
				entity: ["bullet", {
					reload: 600,
					recoil: 0.025,
					spread: 0.1,
					shudder: 0.05,
					speed: 0.3,
					damage: 0.2
				}]
			},
		]
	}
	definitions.turret = {
		shape: [0, 0],
		type: "turret",
		label: "",
		name: "",
		color: "grey",
		size: 16,
		max_health: Infinity,
		facing_type: "snap",
		fov: 2,
		body: {
			accel: 0,
			friction: 0,
			maxSpeed: 0,
			damage: 0,
			regen: 0,
			pushresistance: 0,
			pushforce: 0,
		},
		guns: [
			{
				length: 0.7,
				width: 0.65,
				aspect: 0,
				offsetX: 0.7,
				offsetY: 0,
				offsetRot: 0,
				entity: ["bullet", {
					reload: 600,
					recoil: 0.025,
					spread: 0.1,
					shudder: 0.05,
					speed: 0.3,
					damage: 0.2
				}]
			},
		]
	}
	definitions.playerBody = {
		shape: [3, Math.PI],
		type: "tank",
		label: "",
		name: "",
		color: "red",
		size: 13,
		max_health: 40,
		facing_type: "snap",
		upgrades: [],
		fov: 2.3,
		body: {
			accel: 0.012,
			friction: 0.995,
			maxSpeed: Infinity,
			damage: 1,
			regen: 0.001,
			pushresistance: 0.03,
			pushforce: 0.2,
		},
		guns: [],
		turrets: []
	}
	definitions.triangl = {
		parent: "playerBody",
		label: "Triangl",
		upgrades: ["trianglBasic", "trianglSniper", "trianglMachineGun", "trianglHangar"]
	}
	definitions.trianglBasic = {
		parent: "playerBody",
		label: "Basic",
		guns: [
			{
				length: 0.8,
				width: 0.65,
				aspect: 0,
				offsetX: 0.4,
				offsetY: 0,
				offsetRot: 0,
				entity: ["bullet", {
					reload: 400,
					recoil: 0.025,
					spread: 0.1,
					shudder: 0.06,
					speed: 0.2,
					damage: 0.15
				}]
			}
		]
	}
	definitions.trianglSniper = {
		parent: "playerBody",
		label: "Sniper",
		guns: [
			{
				length: 1.1,
				width: 0.65,
				aspect: 0,
				offsetX: 0.4,
				offsetY: 0,
				offsetRot: 0,
				entity: ["bullet", {
					reload: 800,
					recoil: 0.025,
					spread: 0.07,
					shudder: 0.04,
					speed: 0.25,
					damage: 0.2
				}]
			}
		]
	}
	definitions.trianglMachineGun = {
		parent: "playerBody",
		label: "Machine Gun",
		guns: [
			{
				length: 0.8,
				width: 0.65,
				aspect: 0.3,
				offsetX: 0.4,
				offsetY: 0,
				offsetRot: 0,
				entity: ["bullet", {
					reload: 300,
					recoil: 0.025,
					spread: 0.5,
					shudder: 0.1,
					speed: 0.15,
					damage: 0.1
				}]
			}
		]
	}
	definitions.trianglHangar = {
		parent: "playerBody",
		label: "Hangar",
		upgrades: ["trianglBattleship"],
		guns: [
			{
				length: 0.6,
				width: 0.65,
				aspect: 0.3,
				offsetX: 0.4,
				offsetY: 0,
				offsetRot: 0,
				entity: ["drone", {
					reload: 600,
					recoil: 0.025,
					spread: 0.5,
					shudder: 0.1,
					speed: 0.15,
					damage: 0.1
				}]
			}
		]
	}
	definitions.trianglBattleship = {
		parent: "playerBody",
		label: "Battleship",
		guns: [
			{
				length: 0.6,
				width: 0.65,
				aspect: 0.3,
				offsetX: 0.4,
				offsetY: 0,
				offsetRot: 0,
				entity: ["droneWithAGun", {
					reload: 600,
					recoil: 0.025,
					spread: 0.5,
					shudder: 0.1,
					speed: 0.15,
					damage: 0.1
				}]
			}
		]
	}

// flatten definitions
for (let def of Object.keys(definitions)) {
	let definition = definitions[def]
	if (definition.parent) {
		let parent = definitions[definition.parent]
		definition.type = definition.type ? definition.type : parent.type
		definition.shape = definition.shape ? definition.shape : parent.shape
		definition.label = definition.label ? definition.label : parent.label
		definition.name = definition.name ? definition.name : parent.name
		definition.color = definition.color ? definition.color : parent.color
		definition.size = definition.size ? definition.size : parent.size
		definition.max_health = definition.max_health ? definition.max_health : parent.max_health
		definition.facing_type = definition.facing_type ? definition.facing_type : parent.facing_type
		definition.upgrades = definition.upgrades ? definition.upgrades : parent.upgrades
		definition.body = definition.body ? definition.body : parent.body
		definition.fov = definition.fov ? definition.fov : parent.fov
		definition.guns = definition.guns ? definition.guns : parent.guns
		definition.turrets = definition.turrets ? definition.turrets : parent.turrets
	}
}

//define mockups
let mockups = {}
for (let def of Object.keys(definitions)) {
	let name = def
	let definition = definitions[def]
	let mockup = {
		shape: definition.shape,
		guns: definition.guns,
		turrets: definition.turrets
	}
	mockups[name] = mockup
}
module.exports = { definitions, mockups }