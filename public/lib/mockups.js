const mockups = {
	egg: {
		shape: 0,
	},
	square: {
		shape: 4,
	},
	triangle: {
		shape: 3,
	},
	pentagon: {
		shape: 5,
	},
	betaPentagon: {
		shape: 5,
	},
	alphaPentagon: {
		shape: 5,
	},
	crasher: {
		shape: 3,
	},
	rock: {
		shape: -7,
	},
	bullet: {
		shape: 0,
	},
	block: {
		shape: -4,
	},
	basic: {
		shape: 0,
		guns: [
			{
				length: 1,
				width: 0.65,
				aspect: 0,
				offsetX: 0.3,
				offsetY: 0,
				offsetRot: 0
			}
		]
	},
	conqueror: {
		shape: 0,
		guns: [
			{
				length: 0.55,
				width: 0.65,
				aspect: 0,
				offsetX: 0.7,
				offsetY: 0,
				offsetRot: 0
			},
			{
				length: 0.25,
				width: 1,
				aspect: 0,
				offsetX: 1,
				offsetY: 0,
				offsetRot: 0
			},
			{
				length: 0.8,
				width: 1,
				aspect: 0,
				offsetX: 0.5,
				offsetY: 0,
				offsetRot: Math.PI
			}
		]
	},
}
export { mockups }