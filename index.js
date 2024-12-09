const port = 8080
const WebSocket = require("ws")
const path = require("path");
const express = require("express")
const app = express()
const http = require("http")
const fs = require("fs")

const global = require("./lib/global.js")
const protocol = require("./lib/protocol.js")
const Entity = require("./lib/entity.js")
const { definitions, mockups } = require("./lib/definitions.js")
const tokens = require("./lib/tokens.js")

app.use(express.static(path.join(__dirname, 'public')))
const server = http.createServer(app)

const wss = new WebSocket.Server({ server })
fs.writeFile("./public/lib/mockups.json", JSON.stringify(mockups), "utf8", function(err) {
		if (err) throw err
		console.log("Written to mockups.json.")
	}
)

let entityLoop = setInterval(() => {
	// update all entities
	for (let entity of global.entities) {
		entity.update()
		for (let gun of entity.guns) {
			gun.reload()
		}
	}
	
	// spawn food
	if (global.food_amount < global.food_cap) {
		let rand = Math.floor(Math.random() * global.food_types.length)
		let food = new Entity(
			{
				x: Math.random() * global.map.width,
				y: Math.random() * global.map.height,
			}
		)
		food.define(global.food_types[rand])
		global.food_amount++
	}
})

let packetLoop = setInterval(() => {
	// send/process client packets
	for (let socket of global.sockets) {
		if (socket.entity) {
			let entities = ["e"]
			for (let entity of global.entities) {
				let dist = Math.hypot(entity.pos.x - socket.entity.pos.x, entity.pos.y - socket.entity.pos.y)
				if (entity.alpha > 0 && dist < (2 * 700) / socket.entity.fov) {
					entities.push(
						entity.className,
						entity.pos.x,
						entity.pos.y,
						entity.target.x,
						entity.target.y,
						entity.label,
						entity.name,
						entity.size,
						entity.color,
						entity.score,
						entity.draw_health ? entity.health.value : 0,
						entity.draw_health ? entity.health.max : 0,
						entity.alpha,
						entity.type,
						entity.layerDifference
					)
				}
			}
			entities = protocol.encode(entities)
			socket.send(entities)
			
			// process input packet
			//socket.lastInputs = socket.inputs
				if (socket.inputs.keyboard.KeyW) socket.entity.speed.y -= socket.entity.body.accel + (socket.entity.skills.speed * 0.0002)
				if (socket.inputs.keyboard.KeyA) socket.entity.speed.x -= socket.entity.body.accel + (socket.entity.skills.speed * 0.0002)
				if (socket.inputs.keyboard.KeyS) socket.entity.speed.y += socket.entity.body.accel + (socket.entity.skills.speed * 0.0002)
				if (socket.inputs.keyboard.KeyD) socket.entity.speed.x += socket.entity.body.accel + (socket.entity.skills.speed * 0.0002)
				if (socket.inputs.mouse.left) {
					for (let gun of socket.entity.guns) {
						gun.fire()
					}
				}
				if (socket.inputs.mouse.pos.x) socket.entity.target.x = socket.inputs.mouse.pos.x
				if (socket.inputs.mouse.pos.y) socket.entity.target.y = socket.inputs.mouse.pos.y

			// calculate socket inactivity
			//if (socket.inputs === socket.lastInputs) socket.inactivity++
			//if (socket.inactivity > 1000) socket.kick("AFK Timeout")
			
			socket.talk(
				"c", // camera packet
				socket.entity.pos.x,
				socket.entity.pos.y,
				socket.entity.fov,
			)
			let clientInfo = [
				"I", // client info packet
				global.sockets.length,
				socket.entity.className,
				socket.entity.label,
				socket.entity.name,
				socket.entity.score,
				socket.entity.size,
				socket.entity.skillPoints,
				socket.entity.skills.damage,
				socket.entity.skills.health,
				socket.entity.skills.regen,
				socket.entity.skills.gspeed,
				socket.entity.skills.ghealth,
				socket.entity.skills.gpen,
				socket.entity.skills.gdamage,
				socket.entity.skills.greload,
				socket.entity.skills.speed,
				socket.entity.skillPoints,
			]
			for (let i = 0; i < socket.entity.upgrades.length; i++) {
				clientInfo.push(socket.entity.upgrades[i], definitions[socket.entity.upgrades[i]].label)
			}
			socket.send(protocol.encode(
				clientInfo
			))
			if (global.entities.indexOf(socket.entity) === -1) {
				if (socket.dead) return
				socket.talk("d") // dead
				socket.dead = true
			}
		}
	}
}, 20)

let socketIndex = 0
let chatMessages = []
wss.on("connection", (socket) => {
	
	// socket functions
	socket.talk = (...packet) => {
		socket.send(protocol.encode(packet))
	}
	socket.kick = (msg) => {
		console.log(`Kicked socket: ${msg}`)
		socket.talk("D", msg)
		socket.close()
	}
	/*
	socket.ip = socket._socket.remoteAddress
	for (let other of global.sockets) {
		if (socket.ip === other.ip) {
			socket.kick("Too many connections from the same IP")
			return
		}
	}
	*/
	
	socket.inputs = {
		mouse: {
			pos: {
				x: 0,
				y: 0,
			},
			left: 0,
			middle: 0,
			right: 0,
		},
		keyboard: {
			KeyW: 0,
			KeyA: 0,
			KeyS: 0,
			KeyD: 0,
		},
	}
	socket.dead = true
	socket.send(protocol.encode([
		"m", // map
		global.map.width,
		global.map.height,
	].flat()))
	
	global.sockets.push(
		socket
	)
	socketIndex++
	
	console.log(`Client connected, Player Count: \x1b[33m${global.sockets.length}\x1b[0m`)
	socket.on("message", (e) => {
		if (!e instanceof Uint8Array) socket.kick("Non Binary packet")
		let m = protocol.decode(e)
		let header = m[0]
		m = m.slice(1)
		
		switch(header) {
			case "S": // spawn packet
				if (typeof m[0] !== "string" || m[0].length > 20 || typeof m[1] !== "string" || m[1].length > 50 || m.length > 2 || !socket.dead) {
					socket.kick("Invalid spawn packet")
					break
				}
				socket.token = m[1]
				socket.permission = 0
				for (let key of Object.keys(tokens)) {
					let token = tokens[key]
					if (socket.token === token.token) socket.permission = token.level
				}
				socket.entity = new Entity(
					{
						x: Math.random() * global.map.width,
						y: Math.random() * global.map.height,
					},
				)
				socket.entity.define(global.player_spawn_class)
				socket.entity.name = m[0]
				socket.entity.team = Math.floor(Math.random() * 10000)
				socket.entity.socket = socket
				
				socket.dead = false
				socket.talk("w") // welcome to the game
				console.log(`Client has spawned ingame with name: ${socket.entity.name}, with token: ${socket.token}`)
				
				// send welcome messages ^_^
				socket.talk("B", "You have spawned! Welcome to the game...", 3000)
			break
			
			case "i": // input packet
				if (m.length !== 9) {
					socket.kick("Invalid input packet")
				}
				socket.inputs.keyboard.KeyW = m[0] | 0
				socket.inputs.keyboard.KeyA = m[1] | 0
				socket.inputs.keyboard.KeyS = m[2] | 0
				socket.inputs.keyboard.KeyD = m[3] | 0
				socket.inputs.mouse.left = m[4] | 0
				socket.inputs.mouse.middle = m[5] | 0
				socket.inputs.mouse.right = m[6] | 0
				socket.inputs.mouse.pos.x = m[7] | 0
				socket.inputs.mouse.pos.y = m[8] | 0
			break
			
			case "m": // you got mail
				if (typeof m[0] !== "string") {
					socket.kick("Invalid message packet")
					break
				}
				if (socket.dead) break
				if (m[0].length > 64) {
					socket.talk("B", "Too long!", 2000)
					break
				}

				if (m[0][0] === "/") {
					if (socket.permission === 5) {
						switch(m[0].split(" ")[0]) {
							case "/define":
								let ent = m[0].split(" ")[1]
								if (definitions[ent]) {
									socket.entity.define(ent)
								} else {
									socket.talk("B", "Invalid Entity!", 2000)
								}
							break
							
							case "/kill":
								if (!socket.dead) {
									socket.entity.kill()
								}
							break
							
							case "/score":
								let score = m[0].split(" ")[1]
								if (!socket.dead) {
									socket.entity.score = score
								}
							break
						}
					} else {
						socket.talk("B", "You don't have access to this command", 2000)
					}
					break
				}
				
				let author = socket.entity.name === "" ? "An unnamed player" : socket.entity.name
				let chatMessage = `<${author}> ${m[0]}`
				for (let socket of global.sockets) {
					socket.talk(
						"C", // chat message
						chatMessage
					)
				}
				chatMessages.push(chatMessage)
				console.log(chatMessage)
			break
			
			case "s": // skill
				if (typeof m[0] !== "number") {
					socket.kick("Invalid skill packet")
					break
				}
				if (socket.dead) break
				if (socket.entity.skillPoints < 1) break
				
				let skill = ["damage", "health", "regen", "gspeed", "ghealth", "gpen", "gdamage", "greload", "speed"][m[0]]
				if (socket.entity.skills[skill] < 9) {
					socket.entity.skills[skill]++
					socket.entity.skillPoints--
				}
				
			break
			
			case "U": //upgrade
				if (typeof m[0] !== "number" || !socket.entity.upgrades[m[0]]) {
					socket.kick("Invalid upgrade packet")
					break
				}
				if (socket.dead) break
				let ent = socket.entity.upgrades[m[0]]
				socket.talk("B", `You have upgraded to ${definitions[ent].label}.`, 2000)
				socket.entity.define(ent)
			break
			
			default: // i cant read this
				socket.kick("Invalid packet")
			break
		}
	})
	socket.on("close", () => {
		if (!socket.dead) socket.entity.kill()
		global.sockets.splice(
			global.sockets.indexOf(socket)
		)
		console.log(`Client disconnected, Player Count: \x1b[33m${global.sockets.length}\x1b[0m`)
	})

	socket.on("error", (e) => {
		console.log(e)
	})
})

console.log(`Map	Width -> \x1b[33m${global.map.width}\x1b[0m\n	Height -> \x1b[33m${global.map.height}\x1b[0m`)
console.log(`Player Spawn Class -> \x1b[33m${global.player_spawn_class}\x1b[0m`)
console.log(`Food Cap -> \x1b[33m${global.food_cap}\x1b[0m`)
console.log(`Gamemode -> \x1b[33m${global.gamemode}\x1b[0m`)

server.listen(port, () => {
	console.log(`Server Port -> \x1b[33m${port}\x1b[0m`)
})