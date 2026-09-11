import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { phone_number, custom_message } = body;

    const renderUrl = process.env.RENDER_BOT_URL;

    if (!renderUrl) {
      return NextResponse.json(
        { error: 'Falta configurar RENDER_BOT_URL en las variables de entorno' },
        { status: 500 }
      );
    }

    // Llamada al servidor de Render
    const response = await fetch(`${renderUrl}/send-test`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phone_number,
        message: custom_message,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data.error || 'Error en el servicio de Render' },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json(
      { error: 'No se pudo conectar con el servidor en Render: ' + err.message },
      { status: 500 }
    );
  }
}