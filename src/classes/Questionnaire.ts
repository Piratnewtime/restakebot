import readlineSync from "readline-sync";

export function askSecret (text: string): string {
	return readlineSync.question(text + ': ', {
        hideEchoBack: true,
        mask: ''
    })
}

export function askPublic (text: string): string {
	return readlineSync.question(text + ': ')
}

export function askSelectList (question: string, options: string[]): number {
    return readlineSync.keyInSelect(options, question);
}

export function askYesNo (question: string): boolean {
    return readlineSync.keyInYNStrict(question);
}