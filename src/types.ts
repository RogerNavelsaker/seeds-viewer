export interface Issue {
	id: string;
	title: string;
	status: string;
	type?: string;
	priority: number;
	blocks?: string[];
	blockedBy?: string[];
	createdAt?: string;
	updatedAt?: string;
}
