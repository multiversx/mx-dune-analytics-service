export function joinCsvAttributes(...attributes: any[]): string {
    return attributes.join(',');
}

export function toSnakeCase(camelCaseString: string): string {
    const snakeCaseString = camelCaseString.replace(/([a-z])([A-Z])/g, '$1_$2').toLowerCase();
    return snakeCaseString;
}
