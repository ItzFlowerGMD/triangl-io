const global = require("./global.js")
const { definitions } = require("./definitions.js")

// utility
function rotate(cx, cy, x, y, angle) {
	let cos = Math.cos(angle)
	let sin = Math.sin(angle)
	let nx = (cos * (x - cx)) + (sin * (y - cy)) + cx
	let ny = (cos * (y - cy)) - (sin * (x - cx)) + cy
	return [nx, ny]
}

class Gun {
	constructor(length, width, offsetX, offsetY, offsetRot, entity, master) {
		this.length = length
		this.width = width
		this.offsetX = offsetX
		this.offsetY = offsetY
		this.offsetRot = offsetRot
		this.entity = entity
		this.master = master
		this.reloadTick = 0
		this.canShoot = true
	}
	fire() {
		if (!this.canShoot || !this.entity) return
		
		let targetToAngle = Math.atan2(this.master.target.y, this.master.target.x)
		let angle_spread = ((Math.random() - 0.5) * this.entity[1].spread)
		let magnitude = this.entity[1].speed + (this.master.skills.gspeed * 0.03) + ((Math.random() - 0.5) * this.entity[1].shudder)
		let spawn = rotate(
			this.master.pos.x,
			this.master.pos.y,
			((this.offsetX + this.length) * this.master.size) + this.master.pos.x,
			(this.offsetY * this.master.size) + this.master.pos.y,
			-targetToAngle + this.offsetRot
		)
		let projectile = new Entity(
			{
				x: spawn[0],
				y: spawn[1],
			}
		)
		projectile.define(this.entity[0])
		projectile.speed.x = Math.cos(targetToAngle + angle_spread - this.offsetRot) * magnitude
		projectile.speed.y = Math.sin(targetToAngle + angle_spread - this.offsetRot) * magnitude
		projectile.team = this.master.team
		projectile.baseSize = this.width * (this.master.size / 1.5)
		projectile.master = this.master
		projectile.body.damage = this.entity[1].damage + (this.master.skills.gdamage * 0.02)
		projectile.body.pushresistance = 0.01 / (this.master.skills.gpen * 0.15 + 0.1)
		projectile.health.baseMax += (this.master.skills.ghealth * 30)
		if (this.master.master) {
			projectile.color = this.master.master.color
		} else {
			projectile.color = this.master.color
		}
		if (this.entity[0] === "drone") {
			projectile.body.accel = (this.master.skills.gspeed * 0.0001) + 0.0006
		}
		
		this.master.speed.x += Math.cos((targetToAngle + angle_spread - this.offsetRot) + Math.PI) * this.entity[1].recoil
		this.master.speed.y += Math.sin((targetToAngle + angle_spread - this.offsetRot) + Math.PI) * this.entity[1].recoil
		
		this.canShoot = false
		this.reloadTick = 0
	}
	reload() {
		if (!this.entity) return
		if (this.reloadTick < this.entity[1].reload - (this.master.skills.greload * 30)) {
			this.reloadTick++
			this.canShoot = false
		} else {
			this.canShoot = true
		}
	}
}

class Entity {
	constructor(
		pos = { x: 0, y: 0 },
	) {
		this.pos = pos
		this.speed = { x: 0, y: 0, global: 0 }
		this.baseSize = 0
		this.size = 0
		this.size_with_score = 0
		this.team = 0
		this.label = "Unknown Entity"
		this.name = ""
		this.type = ""
		this.color = "grey"
		this.score = 0
		this.upgrades = []
		this.health = { value: 1, max: 1 }
		this.target = { x: 0, y: 0 }
		this.angle = 0
		this.lifetime = 0
		this.tick = Math.random() * (Math.PI * 2)
		this.alpha = 1
		this.hitbox = this.size * 0.65
		this.socket = undefined
		this.max_lifetime = Infinity
		this.draw_health = true
		this.lastHitBy = undefined
		this.master = undefined
		this.skillPoints = 99
		this.skills = {
			damage: 0,
			health: 0,
			regen: 0,
			gspeed: 0,
			ghealth: 0,
			gpen: 0,
			gdamage: 0,
			greload: 0,
			speed: 0
		}
		this.body = {
			accel: 0,
			friction: 0,
			maxSpeed: 0,
			damage: 0,
			regen: 0,
			pushresistance: 0,
			pushforce: 0
		}
		this.facing_type = "snap"
		this.baseFov = 1
		this.fov = 1
		this.guns = []
		this.turrets = []
		this.dying = false
		this.layerDifference = 0
		
		if (this.type === "food") global.food_amount++
		
		global.entities.push(this)
	}
	define(definition) {
		this.className = definition
		definition = definitions[definition]
		this.baseSize = definition.size ? definition.size : 0
		if (this.team === undefined) this.team = 0
		this.label = definition.label ? definition.label : ""
		if (definition.name) this.name === definition.name
		this.type = definition.type ? definition.type : ""
		this.color = definition.color ? definition.color : "#000000"
		if (definition.score) this.score === definition.score	
		this.upgrades = definition.upgrades ? definition.upgrades : []
		this.baseFov = definition.fov
		this.fov = definition.fov
		this.rotationType = Math.round(Math.random()) ? -1 : 1
		
		this.health = {
			value: definition.max_health ? definition.max_health : 0,
			max: definition.max_health ? definition.max_health : 0,
			baseMax: definition.max_health ? definition.max_health : 0
		}
		
		this.max_lifetime = definition.lifetime ? definition.lifetime : Infinity
		this.draw_health = definition.draw_health === undefined ? true : definition.draw_health
		
		if (definition.body) this.body = definition.body
		if (definition.skills) this.skills = definition.skills
		this.facing_type = definition.facing_type ? definition.facing_type : "snap"
		
		// clear all turrets
		for (let turret of this.turrets) {
			turret.kill()
		}
		this.guns = []
		this.turrets = []
		let guns = definition.guns ? definition.guns : []
		let turrets = definition.turrets ? definition.turrets : []
		for (let gun of guns) {
			this.guns.push(new Gun(
				gun.length,
				gun.width,
				gun.offsetX,
				gun.offsetY,
				gun.offsetRot,
				gun.entity,
				this
			))
		}
		for (let turret of turrets) {
			let tur = new Entity()
			tur.define(turret.entity)
			tur.type = "turret"
			tur.baseSize = turret.size
			tur.maxRange = turret.maxRange
			tur.ifNoTarget = turret.ifNoTarget
			tur.offsetRot = turret.offsetRot
			tur.offsetX = turret.offsetX
			tur.offsetY = turret.offsetY
			tur.layerDifference = turret.layerDifference
			tur.master = this
			this.turrets.push(tur)
		}
	}
	update() {
		if (this.dying) return
		if (this.type !== "turret") {
			if (this.type === "food") {
				if (!this.socket) {
					this.speed.x += Math.cos(this.tick * 0.003) * this.body.accel
					this.speed.y += Math.sin(this.tick * 0.003) * this.body.accel
				}
			}

			if (this.facing_type === "rotateWithSpeed") {
				this.angle -= (Math.hypot(0 - this.speed.x, 0 - this.speed.y) * (this.rotationType * 0.035))
				this.target.x = Math.cos(this.angle)
				this.target.y = Math.sin(this.angle)
			}
			if (this.facing_type === "snapToSpeed") {
				this.angle = Math.atan2(this.speed.y, this.speed.x)
				this.target.x = Math.cos(this.angle)
				this.target.y = Math.sin(this.angle)
			}
			if (this.type === "drone") {
				if (this.master) {
					this.angle = Math.atan2((this.master.target.y + this.master.pos.y * this.master.fov) - this.pos.y * this.master.fov, (this.master.target.x + this.master.pos.x * this.master.fov) - this.pos.x * this.master.fov)
					this.target.x = Math.cos(this.angle)
					this.target.y = Math.sin(this.angle)
					
					this.speed.x += Math.cos(this.angle) * this.body.accel
					this.speed.y += Math.sin(this.angle) * this.body.accel
				}
			}
			
			for (let other of global.entities) {
				if (other === this) break
				let dist = Math.hypot(this.pos.x - other.pos.x, this.pos.y - other.pos.y)
				if (dist < this.hitbox + other.hitbox) {
					let vector
					
					if (!(this.team === other.team && this.type === "bullet")) {
						vector = Math.atan2(other.pos.y - this.pos.y, other.pos.x - this.pos.x) + Math.PI
						this.speed.x += Math.cos(vector) * (other.body.pushforce * this.body.pushresistance)
						this.speed.y += Math.sin(vector) * (other.body.pushforce * this.body.pushresistance)
					
						vector = Math.atan2(this.pos.y - other.pos.y, this.pos.x - other.pos.x) + Math.PI
						other.speed.x += Math.cos(vector) * (this.body.pushforce * other.body.pushresistance)
						other.speed.y += Math.sin(vector) * (this.body.pushforce * other.body.pushresistance)
					}
					
					if (this.team !== other.team) {
						this.health.value -= (other.body.damage + other.skills.damage * 0.4) * other.speed.global
						this.lastHitBy = other
						
						other.health.value -= (this.body.damage + this.skills.damage * 0.4) * this.speed.global
						other.lastHitBy = this
					}
				}
			}
			
			//arena bounds
			if (this.pos.x < 0) {
				this.pos.x = 0
				this.speed.x = 0
			}
			if (this.pos.x > global.map.width) {
				this.pos.x = global.map.width
				this.speed.x = 0
			}
			if (this.pos.y < 0) {
				this.pos.y = 0
				this.speed.y = 0
			}
			if (this.pos.y > global.map.height) {
				this.pos.y = global.map.height
				this.speed.y = 0
			}
			
			this.speed.x *= this.body.friction
			this.speed.y *= this.body.friction
			this.speed.global = Math.hypot(this.speed.y, this.speed.x)
			
			if (this.speed.x > this.body.maxSpeed) this.speed.x = this.body.maxSpeed
			if (this.speed.y > this.body.maxSpeed) this.speed.y = this.body.maxSpeed
			if (this.speed.x < -this.body.maxSpeed) this.speed.x = -this.body.maxSpeed
			if (this.speed.y < -this.body.maxSpeed) this.speed.y = -this.body.maxSpeed
			
			this.pos.x += this.speed.x
			this.pos.y += this.speed.y

			this.size = this.baseSize + this.score / 2000
			this.hitbox = this.size / 1.5
			if (this.health.value < this.health.max) this.health.value += this.body.regen + (this.skills.regen * 0.0002)
			this.health.max = this.health.baseMax + (this.skills.health * 0.5)
		
			if (this.health.value <= 0 || this.lifetime > this.max_lifetime) this.kill()
		} else {
			this.size = this.baseSize * this.master.size
			
			let targetToAngle = Math.atan2(this.master.target.y, this.master.target.x)
			let turretPos = rotate(
				this.master.pos.x,
				this.master.pos.y,
				((this.offsetX) * this.master.size) + this.master.pos.x,
				(this.offsetY * this.master.size) + this.master.pos.y,
				-targetToAngle + this.offsetRot
			)
			
			this.pos.x = turretPos[0]
			this.pos.y = turretPos[1]
			this.skills = this.master.skills
			this.team = this.master.team
			if (this.score) {
				this.master.score += this.score
				this.score = 0
			}
			
			//calculate nearest
			let dists = []
			let entities = []
			let nearest = [
				Infinity,
				undefined
			]
			for (let other of global.entities) {
				if (!((other === this) || (this.team === other.team) || (other.type === "bullet" || other.type === "block" || other.type === "drone" || other.type === "turret" || other.type === "rock"))) {
					dists.push(Math.hypot(this.pos.x - other.pos.x, this.pos.y - other.pos.y))
					entities.push(other)
				}
			}
			nearest[0] = Math.min(...dists)
			nearest[1] = entities[dists.indexOf(nearest[0])]
			if (nearest[0] < this.maxRange) {
				this.target.x = -(this.pos.x - nearest[1].pos.x)
				this.target.y = -(this.pos.y - nearest[1].pos.y)
				for (let gun of this.guns) {
					gun.fire()
				}
			} else {
				if (Array.isArray(this.ifNoTarget)) {
					if (this.ifNoTarget[0] === "spin") {
						this.angle = Math.atan2(this.target.y, this.target.x)
						this.angle += this.ifNoTarget[1]
						this.target.x = Math.cos(this.angle)
						this.target.y = Math.sin(this.angle)
					}
				} else if (this.ifNoTarget === "masterAngle") {
					this.angle = Math.atan2(this.master.target.y, this.master.target.x) - this.offsetRot
					this.target.x = Math.cos(this.angle)
					this.target.y = Math.sin(this.angle)
				}
			}
		}
		this.fov = 16 / (this.size / this.baseFov)
		if (this.master) {
			if (global.entities.indexOf(this.master) === -1) this.kill()
		}
		this.lifetime++
		this.tick += (Math.random() * 0.5) * this.rotationType
	}
	kill() {
		if (this.dying) return
		this.dying = true
		
		let fadeout = setInterval(() => {
			this.alpha -= 0.005
			this.size += 0.04
			this.hitbox = 0
			if (this.alpha <= 0) {
				if (this.type === "food") global.food_amount--
				if (this.lastHitBy && this.type !== "turret") {
					
					/*
					if (this.lastHitBy.master) {
						this.lastHitBy.master.score += this.score
					} else {
						this.lastHitBy.score += this.score
					}
					*/
				}
				clearInterval(fadeout)
				global.entities.splice(
					global.entities.indexOf(this), 1
				)
			}
		})
	}
}
module.exports = Entity