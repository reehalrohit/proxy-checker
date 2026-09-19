import { NextResponse } from 'next/server';
import net from 'net';

export async function POST(req: Request) {
  try {
    const { ip, port } = await req.json();
    if (!ip || !port) return NextResponse.json({ error: 'Missing IP or Port' }, { status: 400 });

    const start = Date.now();
    
    // Explicitly type the Promise as <NextResponse> here
    return new Promise<NextResponse>((resolve) => {
      const socket = new net.Socket();
      socket.setTimeout(2500);
      
      socket.on('connect', () => {
        const ping = Date.now() - start;
        socket.destroy();
        resolve(NextResponse.json({ status: 'working', ping }));
      });

      socket.on('timeout', () => {
        socket.destroy();
        resolve(NextResponse.json({ status: 'dead', ping: -1 }));
      });

      socket.on('error', () => {
        socket.destroy();
        resolve(NextResponse.json({ status: 'dead', ping: -1 }));
      });

      socket.connect(Number(port), ip);
    });
  } catch (error) {
    return NextResponse.json({ status: 'error' }, { status: 500 });
  }
}
