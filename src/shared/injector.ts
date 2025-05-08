type Constructor<T> = new () => T;
const instances = new Map<Constructor<any>, any>();

export function inject<T>(service: Constructor<T>): T {
	if (!instances.has(service)) {
		instances.set(service, new service());
	}
	return instances.get(service) as T;
}