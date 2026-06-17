// Dracula Theme (beads_viewer / os-eco standard branding)
const colors = {
	purple: [189, 147, 249],
	pink: [255, 121, 198],
	cyan: [139, 233, 253],
	green: [80, 250, 123],
	yellow: [241, 250, 140],
	orange: [255, 184, 108],
	red: [255, 85, 85],
	comment: [98, 114, 164],
	foreground: [248, 248, 242],
};

function rgb(r: number, g: number, b: number, text: string | number): string {
	return `\x1b[38;2;${r};${g};${b}m${text}\x1b[0m`;
}

export const theme = {
	primary: (text: string | number) =>
		rgb(colors.purple[0], colors.purple[1], colors.purple[2], text),
	secondary: (text: string | number) => rgb(colors.pink[0], colors.pink[1], colors.pink[2], text),
	accent: (text: string | number) => rgb(colors.cyan[0], colors.cyan[1], colors.cyan[2], text),
	success: (text: string | number) => rgb(colors.green[0], colors.green[1], colors.green[2], text),
	warning: (text: string | number) =>
		rgb(colors.yellow[0], colors.yellow[1], colors.yellow[2], text),
	error: (text: string | number) => rgb(colors.red[0], colors.red[1], colors.red[2], text),
	muted: (text: string | number) =>
		rgb(colors.comment[0], colors.comment[1], colors.comment[2], text),
	text: (text: string | number) =>
		rgb(colors.foreground[0], colors.foreground[1], colors.foreground[2], text),
	bold: (text: string | number) => `\x1b[1m${text}\x1b[0m`,
};
