import { protocol } from "./lib/protocol.js"
import { colors } from "./lib/colors.js"
// load mockups
let mockups = {}
fetch('./lib/mockups.json')
	.then(response => {
		if (!response.ok) {
			throw new Error("Failed to fetch mockups: " + response.status);
		}
		return response.json();
	})
	.then(json => {
		mockups = json
	})
	.catch(function(e) {
		throw e
	})

const canvas = document.getElementById("gameCanvas")
const ctx = canvas.getContext("2d")
const chatInput = document.getElementById("chatInput")
chatInput.style.visibility = "hidden"
document.getElementById("serverName").innerText = `Server: ${location.href}`

document.getElementById("nameInput").value = localStorage.getItem("name")
document.getElementById("tokenInput").value = localStorage.getItem("token")

// window resizing
let windowWidth, windowHeight, windowZoom
function resize() {
	windowZoom = window.innerWidth / window.outerWidth
	windowWidth = window.innerWidth
	windowHeight = window.innerHeight
	canvas.width = windowWidth
	canvas.height = windowHeight
}
resize()
window.addEventListener("resize", resize)

// player inputs
let inputs = {
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
		ArrowUp: 0,
		ArrowLeft: 0,
		ArrowDown: 0,
		ArrowRight: 0
	},
}

// camera offset
let camera = {
	x: 0,
	y: 0,
	fov: 1,
	smooth: {
		smoothness: 5,
		x: 0,
		y: 0,
		fov: 1,
	},
}

let entities = []
let map = {
	width: 0,
	height: 0,
	setup: []
}
let clientInfo = {
	playerCount: 0,
	className: "",
	label: "",
	name: "",
	score: 0,
	size: 0,
	skillPoints: 0
}
let skills = [
	{name: "Body Damage", value: 0, color: "purple"},
	{name: "Body Health", value: 0, color: "pink"},
	{name: "Body Regeneration", value: 0, color: "orange"},
	{name: "Weapon Speed", value: 0, color: "blue"},
	{name: "Weapon Health", value: 0, color: "green"},
	{name: "Weapon Penetration", value: 0, color: "yellow"},
	{name: "Weapon Damage", value: 0, color: "red"},
	{name: "Weapon Reload", value: 0, color: "lgreen"},
	{name: "Body Speed", value: 0, color: "cyan"}
]
let upgrades = []
let chatMessages = []
let serverMessages = []
let commandLoop
let disconnectedReason = "No reason given"
const TWO_PI = 6.283185307179586

function darkenColor(hex, amount) {
	let r = parseInt(hex.slice(1, 3), 16)
    let g = parseInt(hex.slice(3, 5), 16)
    let b = parseInt(hex.slice(5, 7), 16)

    r -= amount
	g -= amount
	b -= amount
	
	return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)
}

function rotate(cx, cy, x, y, angle) {
	let cos = Math.cos(angle)
	let sin = Math.sin(angle)
	let nx = (cos * (x - cx)) + (sin * (y - cy)) + cx
	let ny = (cos * (y - cy)) - (sin * (x - cx)) + cy
	return [nx, ny]
}

function drawGun(x, y, length, width, aspect, offsetX, offsetY, offsetRot, alpha) {
	
	let cx = x
	let cy = y
	let half_width = width / 2
	let trapezoidVertices = [
		rotate(cx, cy, offsetX, offsetY - half_width, offsetRot),
		rotate(cx, cy, offsetX + length, offsetY - (half_width + (aspect * width)), offsetRot),
		rotate(cx, cy, offsetX + length, offsetY + (half_width + (aspect * width)), offsetRot),
		rotate(cx, cy, offsetX, offsetY + half_width, offsetRot),
	]
	ctx.beginPath()
	for (let i = 0; i < trapezoidVertices.length; i++) {
		let v = trapezoidVertices[i]
		if (i === 0) {
			ctx.moveTo(v[0], v[1])
		} else {
			ctx.lineTo(v[0], v[1])
		}
	}
	ctx.lineTo(trapezoidVertices[0][0], trapezoidVertices[0][1])
	ctx.fillStyle = colors.grey
	ctx.strokeStyle = darkenColor(colors.grey, colors.blend)
	ctx.lineJoin = "round"
	ctx.lineWidth = 3
	ctx.globalAlpha = alpha
	ctx.fill()
	ctx.stroke()
	ctx.globalAlpha = 1
	ctx.closePath()
}

function drawEntity(type, x, y, rotation, size, color, alpha) {
	let mockup = mockups[type]
	if (!mockup) return
	
	// draw guns
	if (mockup.guns) {
		for (let gun of mockup.guns) {
			drawGun(
				x,
				y,
				gun.length * size,
				gun.width * size,
				gun.aspect,
				(gun.offsetX * size) + x,
				(gun.offsetY * size) + y,
				gun.offsetRot -rotation,
				alpha
			)
		}
	}
	
	// draw shape
	ctx.beginPath()
	
	let vertices = []
	
	if (mockup.shape[0] === 0) {
		ctx.arc(x, y, size / 1.4, 0, TWO_PI)
	} else if (mockup.shape[0] > 0) {
		for (let i = 0; i < mockup.shape[0] + 1; i++) {
			let angle = (TWO_PI / mockup.shape[0]) * i + rotation + mockup.shape[1]
			vertices.push([Math.cos(angle) * size + x, Math.sin(angle) * size + y]);
		}
	} else if (mockup.shape[0] < 0) {
		let innerSize = size - (size / (-mockup.shape[0] / 2))
		for (let i = 0; i < -(mockup.shape[0] * 2) + 1; i++) {
			let angle = (TWO_PI / (-mockup.shape[0] * 2)) * i + rotation + mockup.shape[1]
			let radius = i & 1 ? innerSize : size
			vertices.push([Math.cos(angle) * radius + x, Math.sin(angle) * radius + y]);
		}
	}
	
	for (let i = 0; i < vertices.length; i++) {
		if (i === 0) {
			ctx.moveTo(vertices[i][0], vertices[i][1])
		} else {
			ctx.lineTo(vertices[i][0], vertices[i][1])
		}
	}
	
	ctx.fillStyle = colors[color]
	ctx.strokeStyle = darkenColor(colors[color], colors.blend)
	ctx.lineWidth = 3
	ctx.lineJoin = "round"
	ctx.globalAlpha = alpha
	ctx.fill()
	ctx.stroke()
	ctx.globalAlpha = 1
	ctx.closePath()
}

function drawGrid(cellSize, endX, endY) {
	
	//horizontal lines
	for (let i = 0; i <= endX / cellSize; i++) {
		let x = i * cellSize
		ctx.beginPath()
		ctx.lineWidth = 1
		ctx.strokeStyle = darkenColor(colors.innerbackground, 60)
		ctx.moveTo(x, 0)
		ctx.lineTo(x, endY)
		ctx.stroke()
		ctx.closePath()
	}
	//vertical lines
	for (let i = 0; i <= endY / cellSize; i++) {
		let y = i * cellSize
		ctx.beginPath()
		ctx.lineWidth = 1
		ctx.strokeStyle = darkenColor(colors.innerbackground, 60)
		ctx.moveTo(0, y)
		ctx.lineTo(endX, y)
		ctx.stroke()
		ctx.closePath()
	}
}

function drawText(text, x, y, size, align, outline, outlineWidth) {
	ctx.beginPath()
	ctx.fillStyle = "white"
	ctx.strokeStyle = "black"
	ctx.lineWidth = outlineWidth
	ctx.textAlign = align
	ctx.textBaseline = "middle"
	ctx.font = `bold ${size}px Ubuntu`
	if (outline) ctx.strokeText(text, x, y)
	ctx.fillText(text, x, y)
	ctx.closePath()
}

function drawBar(length, x, y, fillWidth, strokeWidth, color, progress, max) {
	let half_length = length / 2
	// background
	ctx.beginPath()
	ctx.strokeStyle = colors["black"]
	ctx.lineWidth = strokeWidth
	ctx.lineCap = "round"
	ctx.moveTo(x - half_length, y)
	ctx.lineTo(x + half_length, y)
	ctx.fill()
	ctx.stroke()
	ctx.closePath()
	
	// value
	ctx.beginPath()
	ctx.strokeStyle = color
	ctx.lineWidth = fillWidth
	ctx.lineCap = "round"
	ctx.moveTo(x - half_length, y)
	ctx.lineTo(x + (progress / max) * length - half_length, y)
	ctx.fill()
	ctx.stroke()
	ctx.closePath()
}

function drawMessage(text, x, y) {
	ctx.font = "bold 20px Ubuntu"
	let half_length = ctx.measureText(text).width / 2
	ctx.beginPath()
	
	ctx.globalAlpha = 0.5
	ctx.strokeStyle = colors.black
	ctx.lineWidth = 20
	ctx.lineCap = "round"
	ctx.moveTo(x - half_length, y)
	ctx.lineTo(x + half_length, y)
	ctx.stroke()
	ctx.globalAlpha = 1
	drawText(text, x, y, 20, "center", true, 4)
	
	ctx.closePath()
}

function drawUpgrade(mockup, entName, x, y, rot, entColor, bgColor) {
	ctx.beginPath()
	ctx.strokeStyle = colors.black
	ctx.fillStyle = colors[bgColor]
	ctx.lineJoin = "round"
	ctx.globalAlpha = 0.8
	ctx.lineWidth = 3
	ctx.rect(x, y, 90, 90)
	ctx.fill()
	ctx.stroke()
	ctx.globalAlpha = 1
	ctx.closePath()
	// drawEntity(type, x, y, rotation, size, color, alpha)
	drawEntity(mockup, x + 45, y + 45, rot, 25, entColor, 1)
	drawText(entName, x + 45, y + 80, 13, "center", true, 3)
}

function bubbleSort(arr) {

	for (var i = 0; i < arr.length; i++) {
		for (var j = 0; j < (arr.length - i - 1); j++) {
			if (arr[j] > arr[j + 1]) {
				var temp = arr[j]
				arr[j] = arr[j + 1]
				arr[j + 1] = temp
			}
		}
	}
	return arr
}
let upgradeSpinTimer = 0
let upgradeClicked = 0
document.getElementById("startBtn").onclick = startGame
function startGame() {
	localStorage.setItem("name", document.getElementById("nameInput").value)
	localStorage.setItem("token", document.getElementById("tokenInput").value)
	
	document.getElementById("titleBg").style.top = "-10000px"
	document.getElementById("startBtn").disabled = true
	document.getElementById("nameInput").disabled = true
	
	document.addEventListener("mousemove", (e) => {
		inputs.mouse.pos.x = e.clientX
		inputs.mouse.pos.y = e.clientY
	})

	document.addEventListener("mousedown", (e) => {
		let idToString = ["left", "middle", "right"][e.button]
		inputs.mouse[idToString] = 1
	})

	document.addEventListener("mouseup", (e) => {
		let idToString = ["left", "middle", "right"][e.button]
		inputs.mouse[idToString] = 0
	})

	document.addEventListener("keydown", (e) => {
		if (document.activeElement !== chatInput) inputs.keyboard[e.code] = 1
		switch(e.code) {
			case "KeyQ":
				if (document.activeElement === chatInput) break
				let ss = document.createElement("a");
				ss.href = canvas.toDataURL("image/png");
				ss.download = `screenshot-${new Date().getTime()}.png`;
				ss.click();
			break
			case "Enter":
				if (chatInput.style.visibility === "hidden") {
					chatInput.style.visibility = "visible"
					chatInput.value = ""
					chatInput.focus()
				} else {
					chatInput.style.visibility = "hidden"
					if (chatInput.value !== "") socket.talk("m", chatInput.value)
				}
			break
			// skill points
			case "Digit1":
				socket.talk("s", 0)
			break
			case "Digit2":
				socket.talk("s", 1)
			break
			case "Digit3":
				socket.talk("s", 2)
			break
			case "Digit4":
				socket.talk("s", 3)
			break
			case "Digit5":
				socket.talk("s", 4)
			break
			case "Digit6":
				socket.talk("s", 5)
			break
			case "Digit7":
				socket.talk("s", 6)
			break
			case "Digit8":
				socket.talk("s", 7)
			break
			case "Digit9":
				socket.talk("s", 8)
			break
		}
	})

	document.addEventListener("keyup", (e) => {
		if (document.activeElement !== chatInput) inputs.keyboard[e.code] = 0
	})
	
	let socket = new WebSocket(`ws://${location.host}`)
	socket.binaryType = "arraybuffer"
	socket.open = false

	socket.talk = (...packet) => {
		if (!socket.open) return
		
		socket.send(protocol.encode(packet))
	}
	
	socket.askToSpawn = () => {
		socket.talk("S", document.getElementById("nameInput").value, document.getElementById("tokenInput").value)
	}
	
	socket.addEventListener("open", () => {
		socket.open = true
		socket.askToSpawn()
	})

	socket.addEventListener("message", (e) => {
		let m = protocol.decode(e.data)
		let header = m[0]
		m = m.slice(1)
		
		switch(header) {
			case "w": // hi
				if (commandLoop) break
				commandLoop = setInterval(() => {
					socket.talk(
						"i",
						inputs.keyboard.KeyW || inputs.keyboard.ArrowUp,
						inputs.keyboard.KeyA || inputs.keyboard.ArrowLeft,
						inputs.keyboard.KeyS || inputs.keyboard.ArrowDown,
						inputs.keyboard.KeyD || inputs.keyboard.ArrowRight,
						inputs.mouse.left,
						inputs.mouse.middle,
						inputs.mouse.right,
						inputs.mouse.pos.x - (windowWidth / 2),
						inputs.mouse.pos.y - (windowHeight / 2)
					)
				})
			break
			
			case "m": // map info
				map.width = m[0]
				map.height = m[1]
				console.log(map)
			break
			
			case "c": // camera info
				camera.x = m[0] //- width
				camera.y = m[1] //- height
				camera.fov = m[2]
			break
			
			case "d": // dead
				setTimeout(() => {
					socket.askToSpawn()
				}, 1000)
			break
			
			case "I": // client info
				clientInfo.playerCount = m[0]
				clientInfo.className = m[1]
				clientInfo.label = m[2]
				clientInfo.name = m[3]
				clientInfo.score = m[4]
				clientInfo.size = m[5]
				// update skill meter
				for (let i = 0; i < 9; i++) {
					skills[i].value = m[i + 7]
				}
				clientInfo.skillPoints = m[16]
				// update upgrades ui
				upgrades = []
				for (let i = 0; i < m.slice(17).length / 2; i++) {
					let slice = i * 2 + 17

					upgrades.push({
						mockup: m.slice(slice, slice + 2)[0],
						label: m.slice(slice, slice + 2)[1]
					})
				}
			break
			
			case "C": // chat message
				if (chatMessages.length >= 20) {
					chatMessages.splice(chatMessages.length - 1, 1)
				}
				chatMessages.unshift(m[0])
			break
			
			case "D": // disconnected
				disconnectedReason = m[0]
			break
			
			case "B": // server message
				serverMessages.push(m[0])
				setTimeout(() => {
					serverMessages.splice(0, 1)
				}, m[1])
			break
			
			case "e": // fun part
				entities = []
				let entityLength = 15
				for (let i = 0; i < m.length / entityLength; i++) {
					let slice = i * entityLength
					let entity = m.slice(slice, slice + entityLength)
					if (entity[14]) {
						entities.push(entity)
					} else {
						entities.unshift(entity)
					}
				}
			break
			
			default:
				
			break
		}
	})

	socket.addEventListener("close", (e) => {
		socket.open = false
		clearInterval(commandLoop)
	})

	socket.addEventListener("error", (e) => {
		console.log(e)
	})
	
	let animationLoop = setInterval(() => {
		
		//smooth camera loop
		camera.smooth.x += camera.x - camera.smooth.x / camera.smooth.smoothness
		camera.x = camera.smooth.x / camera.smooth.smoothness
		
		camera.smooth.y += camera.y - camera.smooth.y / camera.smooth.smoothness
		camera.y = camera.smooth.y / camera.smooth.smoothness
		
		camera.smooth.fov += camera.fov - camera.smooth.fov / camera.smooth.smoothness
		camera.fov = camera.smooth.fov / camera.smooth.smoothness
		
		if (isNaN(camera.smooth.fov)) camera.smooth.fov = 1
		
		//background
		//outside map
		ctx.beginPath()
		ctx.fillStyle = colors.outerbackground
		ctx.fillRect(0, 0, windowWidth, windowHeight)
		ctx.closePath()
		
		// scale everything by fov
		ctx.save()
		ctx.scale(camera.fov * windowZoom, camera.fov * windowZoom)
		ctx.translate(-(camera.x - (windowWidth / (camera.fov * (windowZoom * 2)))), -(camera.y - (windowHeight / (camera.fov * (windowZoom * 2))))) // ugly
		
		//inside map
		ctx.beginPath()
		ctx.fillStyle = colors.innerbackground
		ctx.fillRect(0,0,map.width,map.height)
		ctx.closePath()
		
		//grid
		drawGrid(20, map.width, map.height)
		
		//entities
		let nameBuffer = []
		let healthBuffer = []
		let leaderboardEntries = []
		for (let e of entities) {
			drawEntity(
				e[0], 					// mockup
				e[1], 					// x
				e[2], 					// y
				Math.atan2(e[4], e[3]), // rotation
				e[7], 					// size
				e[8], 					// color
				e[12], 					// alpha
			)
			nameBuffer.push([e[1], e[2], e[6], e[7]])
			healthBuffer.push([e[1], e[2], e[10], e[11], e[7]])
			leaderboardEntries.push([e[0], e[5], e[6], e[9]])
		}
		for (let name of nameBuffer) {
			drawText(
				name[2],
				name[0],
				name[1] - (name[3] + 12),
				12,
				"center",
				true,
				3
			)
		}
		for (let health of healthBuffer) {
			if (health[2] > 0 && health[2] < health[3]) {
				drawBar(
					health[4] * 1.3,
					health[0],
					health[1] + (health[4] + 7),
					3, 5, colors["lgreen"],
					health[2],
					health[3]
				)
			}
		}
		ctx.restore()
		
		//UI elements
		
		// player name
		drawText(clientInfo.name, windowWidth / 2, windowHeight - 80, 35, "center", true, 4)
		
		//level bar
		let maxLevel = 45
		let level = clientInfo.score / 500
		drawBar(500, windowWidth / 2, windowHeight - 25, 24, 30, colors.gold, level > 45 ? maxLevel : level, maxLevel)
		drawText(`Level ${level.toFixed(0)} ${clientInfo.label}`, windowWidth / 2, windowHeight - 25, 25, "center", true, 4)
		
		//score bar
		drawBar(400, windowWidth / 2, windowHeight - 55, 14, 20, colors.lgreen, 100, 100)
		drawText(`Score: ${clientInfo.score}`, windowWidth / 2, windowHeight - 55, 18, "center", true, 4)
		
		// draw upgrades
		for (let i = 0; i < upgrades.length; i++) { 
			let x = 5 + (i * 100)
			let y = 5
			drawUpgrade(upgrades[i].mockup, upgrades[i].label, x, y, upgradeSpinTimer, "blue", Object.keys(colors)[i])
			// make them clickable
			let rect = {
				x: x,
				y: y,
				w: 90,
				h: 90
			}
			if (
				rect.x < inputs.mouse.pos.x &&
				rect.x + rect.w > inputs.mouse.pos.x &&
				rect.y < inputs.mouse.pos.y &&
				rect.y + rect.h > inputs.mouse.pos.y
			) {
				if (inputs.mouse.left) {
					if (!upgradeClicked) socket.talk("U", i)
					upgradeClicked = 1
				} else {
					upgradeClicked = 0
				}
			}
		}
		
		//minimap
		let map_height_difference = (map.width / map.height) * 200
		ctx.beginPath()
		ctx.rect(windowWidth - (map_height_difference + 20), windowHeight - 220, map_height_difference, 200)
		ctx.lineJoin = "round"
		ctx.lineWidth = 3
		ctx.strokeStyle = colors.black
		ctx.fillStyle = colors.white
		ctx.globalAlpha = 0.7
		ctx.fill()
		ctx.globalAlpha = 1
		ctx.stroke()
		ctx.closePath()
		
		//draw minimap entities
		ctx.beginPath()
		ctx.fillStyle = colors.black
		ctx.arc((camera.x / (map.width / map_height_difference)) + (windowWidth - map_height_difference - 20), (camera.y / (map.height / 200)) + (windowHeight - 220), 2, 0, TWO_PI)
		ctx.fill()
		ctx.closePath()
		
		// draw skill bars
		if (inputs.mouse.pos.y > windowHeight - 200 && inputs.mouse.pos.x < 210 || clientInfo.skillPoints > 0) {
			for (let i = 0; i < skills.length; i++) {
				let skill = skills[i]
				let initY = windowHeight - skills.length * 20
				drawBar(200, 110, initY + (i * 20), 11, 15, colors[skill.color], skill.value, 9)
				drawText(skill.name, 110, initY + (i * 20), 16, "center", true, 2)
				drawText(`[${i + 1}]`, 220, initY + (i * 20), 16, "left", true, 2)
			}
			if (clientInfo.skillPoints > 0) drawText(`x${clientInfo.skillPoints}`, 220, windowHeight - 200, 25, "left", true, 1)
		}
		
		// draw chat messages
		for (let i = 0; i < chatMessages.length; i++) {
			drawText(chatMessages[i], windowWidth, 10 + (i * 20), 20, "right", true, 4)
		}
		
		//draw server messages
		for (let i = 0; i < serverMessages.length; i++) {
			drawMessage(serverMessages[i], windowWidth / 2, (i * 25) + 20)
		}
		
		//disconnection screen
		if (!socket.open) {
			ctx.globalAlpha = 0.3
			ctx.fillStyle = colors.red
			ctx.fillRect(0, 0, windowWidth, windowHeight)
			ctx.globalAlpha = 1
			drawText("💀Disconnected from server💀", windowWidth / 2, windowHeight / 2, 35, "center", true, 4)
			drawText(`Reason: ${disconnectedReason}`, windowWidth / 2, windowHeight / 2 + 25, 20, "center", true, 4)
		}

		upgradeSpinTimer += 0.01
	}, 1000 / 60)
}
