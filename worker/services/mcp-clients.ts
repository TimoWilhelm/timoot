type MCPResource<Resource> = {
	name: string;
	load: () => Promise<Resource>;
};

export type AvailableMCPResource<Resource> = {
	name: string;
	value: Resource;
};

export async function loadAvailableMCPResources<Resource>(resources: MCPResource<Resource>[]): Promise<AvailableMCPResource<Resource>[]> {
	const results = await Promise.allSettled(resources.map(({ load }) => load()));
	const loadedResources: AvailableMCPResource<Resource>[] = [];

	for (const [index, result] of results.entries()) {
		const { name } = resources[index];
		if (result.status === 'fulfilled') {
			loadedResources.push({ name, value: result.value });
			continue;
		}

		console.warn('[AI Research MCP Unavailable]', {
			server: name,
			error: result.reason instanceof Error ? result.reason.message : String(result.reason),
		});
	}

	return loadedResources;
}
