type MCPResource<Resource> = {
	name: string;
	load: (abortSignal?: AbortSignal) => Promise<Resource>;
};

type LoadAvailableMCPResourcesOptions = {
	abortSignal?: AbortSignal;
	timeoutMs?: number;
};

export type AvailableMCPResource<Resource> = {
	name: string;
	value: Resource;
};

async function loadResource<Resource>(
	{ load, name }: MCPResource<Resource>,
	{ abortSignal, timeoutMs }: LoadAvailableMCPResourcesOptions,
): Promise<Resource> {
	if (abortSignal === undefined && timeoutMs === undefined) {
		return await load();
	}

	return await new Promise<Resource>((resolve, reject) => {
		const timeoutController = new AbortController();
		const timeout =
			timeoutMs === undefined
				? undefined
				: setTimeout(() => timeoutController.abort(new Error(`${name} timed out after ${timeoutMs}ms`)), timeoutMs);
		const linkedSignal = abortSignal ? AbortSignal.any([abortSignal, timeoutController.signal]) : timeoutController.signal;
		const handleAbort = () => reject(linkedSignal.reason);
		linkedSignal.addEventListener('abort', handleAbort, { once: true });

		const cleanUp = () => {
			if (timeout !== undefined) clearTimeout(timeout);
			linkedSignal.removeEventListener('abort', handleAbort);
		};

		void load(linkedSignal).then(
			(value) => {
				cleanUp();
				resolve(value);
			},
			(error: unknown) => {
				cleanUp();
				reject(error instanceof Error ? error : new Error(String(error)));
			},
		);
	});
}

export async function loadAvailableMCPResources<Resource>(
	resources: MCPResource<Resource>[],
	options: LoadAvailableMCPResourcesOptions = {},
): Promise<AvailableMCPResource<Resource>[]> {
	const results = await Promise.allSettled(resources.map((resource) => loadResource(resource, options)));
	options.abortSignal?.throwIfAborted();
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
