import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const response = await fetch(
      'https://raw.githubusercontent.com/iplocate/free-proxy-list/main/all-proxies.txt',
      { next: { revalidate: 1800 } }
    );

    if (!response.ok) throw new Error('Failed to fetch proxy list');

    const text = await response.text();
    const proxies = text
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0)
      .map((proxy, index) => {
        const [ip, port] = proxy.split(':');
        return { id: index, ip, port, full: proxy };
      });

    return NextResponse.json(proxies);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to load proxies' }, { status: 500 });
  }
}
