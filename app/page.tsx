'use client';
import { useState, useEffect, FormEvent } from 'react';
import { supabase } from './lib/supabaseclient';

// Definición del tipo de dato para cada Contacto
export interface Contact {
  id: string;
  name?: string;
  phone_number: string;
  custom_message?: string;
  is_active: boolean;
  created_at?: string;
}

export default function DashboardPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [name, setName] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [message, setMessage] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [testingId, setTestingId] = useState<string | null>(null);

  // Estados para edición inline
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingMessage, setEditingMessage] = useState<string>('');

  useEffect(() => {
    if (supabase) fetchContacts();
  }, []);

  const fetchContacts = async () => {
    if (!supabase) return;
    const { data, error } = await supabase
      .from('contacts')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setContacts(data as Contact[]);
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!supabase) return alert('Verifica las variables de entorno de Supabase.');
    if (!phone) return alert('Ingresa un número de teléfono válido.');

    const cleanPhone = phone.replace(/[^0-9]/g, '');
    setLoading(true);

    const { error } = await supabase.from('contacts').insert([
      {
        name: name.trim(),
        phone_number: cleanPhone,
        custom_message: message.trim(),
        is_active: true,
      },
    ]);

    setLoading(false);

    if (error) {
      alert('Error al guardar: ' + error.message);
    } else {
      setName('');
      setPhone('');
      setMessage('');
      fetchContacts();
    }
  };

  const handleSendTest = async (contact: Contact) => {
    setTestingId(contact.id);
    try {
      const res = await fetch('/api/send-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone_number: contact.phone_number,
          custom_message: contact.custom_message,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        alert(`¡Mensaje de prueba enviado con éxito a +${contact.phone_number}!`);
      } else {
        alert(`Error al enviar prueba: ${data.error}`);
      }
    } catch (err) {
      alert('Ocurrió un error al intentar comunicar con el servidor de prueba.');
    } finally {
      setTestingId(null);
    }
  };

  const toggleStatus = async (id: string, currentStatus: boolean) => {
    if (!supabase) return;

    // Optimistic Update
    setContacts(contacts.map(c => c.id === id ? { ...c, is_active: !currentStatus } : c));

    const { error } = await supabase
      .from('contacts')
      .update({ is_active: !currentStatus })
      .eq('id', id);

    if (error) fetchContacts();
  };

  const saveEditedMessage = async (id: string) => {
    if (!supabase) return;

    const { error } = await supabase
      .from('contacts')
      .update({ custom_message: editingMessage })
      .eq('id', id);

    if (error) {
      alert('Error al actualizar: ' + error.message);
    } else {
      setEditingId(null);
      fetchContacts();
    }
  };

  const deleteContact = async (id: string) => {
    if (!confirm('¿Seguro que deseas eliminar este contacto?')) return;
    if (!supabase) return;

    setContacts(contacts.filter(c => c.id !== id));
    await supabase.from('contacts').delete().eq('id', id);
  };

  if (!supabase) {
    return (
      <div className="container py-5">
        <div className="alert alert-danger shadow-sm" role="alert">
          <h4 className="alert-heading">
            <i className="bi bi-exclamation-triangle-fill me-2"></i>Falta configurar .env.local
          </h4>
          <p className="mb-0">
            Asegúrate de definir <code>NEXT_PUBLIC_SUPABASE_URL</code> y <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code> en tu archivo de entorno local.
          </p>
        </div>
      </div>
    );
  }

  return (
    <main className="container py-5" style={{ maxWidth: '800px' }}>
      {/* Cabecera */}
      <header className="mb-4 text-center text-md-start">
        <h1 className="fw-bold text-dark mb-1">
          <i className="bi bi-whatsapp text-success me-2"></i>
          Panel de Envíos Diarios
        </h1>
        <p className="text-muted">
          Programación automática de mensajes de buenos días (6:00 AM).
        </p>
      </header>

      {/* Formulario de Registro */}
      <div className="card shadow-sm border-0 mb-4">
        <div className="card-body p-4">
          <h5 className="card-title fw-bold mb-3 text-secondary">
            <i className="bi bi-person-plus-fill me-2"></i>Nuevo Destinatario
          </h5>
          <form onSubmit={handleSubmit}>
            <div className="row g-3 mb-3">
              <div className="col-md-6">
                <label className="form-label fw-semibold text-dark small">Nombre / Alias</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Ej: Juan Pérez"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div className="col-md-6">
                <label className="form-label fw-semibold text-dark small">WhatsApp (Código país sin +)</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Ej: 51987654321"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="mb-3">
              <label className="form-label fw-semibold text-dark small">Mensaje Personalizado</label>
              <textarea
                className="form-control"
                rows={2}
                placeholder="Ej: ¡Buenos días Juan! Excelente jornada."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              ></textarea>
            </div>

            <button type="submit" className="btn btn-primary fw-semibold px-4" disabled={loading}>
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  Guardando...
                </>
              ) : (
                <>
                  <i className="bi bi-plus-circle me-2"></i>Guardar Contacto
                </>
              )}
            </button>
          </form>
        </div>
      </div>

      {/* Encabezado Lista */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h5 className="fw-bold m-0 text-dark">Destinatarios Configurados</h5>
        <span className="badge bg-primary rounded-pill px-3 py-2">
          Total: {contacts.length}
        </span>
      </div>

      {/* Lista de Contactos */}
      {contacts.length === 0 ? (
        <div className="text-center p-5 bg-white rounded shadow-sm border border-light">
          <i className="bi bi-people text-muted fs-1 d-block mb-2"></i>
          <p className="text-muted m-0">No hay contactos guardados aún. Registra el primero arriba.</p>
        </div>
      ) : (
        <div className="d-flex flex-column gap-3">
          {contacts.map((c) => (
            <div
              key={c.id}
              className={`card border-0 shadow-sm transition-all ${
                !c.is_active ? 'bg-light opacity-75' : 'bg-white'
              }`}
            >
              <div className="card-body p-3 d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
                
                {/* Información Principal */}
                <div className="flex-grow-1">
                  <div className="d-flex align-items-center gap-2 mb-1">
                    <span className="fw-bold text-dark fs-6">
                      {c.name || 'Sin Nombre'}
                    </span>
                    <span className="badge bg-light text-secondary border fw-normal">
                      +{c.phone_number}
                    </span>
                  </div>

                  {/* Edición Inline de Mensaje */}
                  {editingId === c.id ? (
                    <div className="mt-2 d-flex gap-2">
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        value={editingMessage}
                        onChange={(e) => setEditingMessage(e.target.value)}
                      />
                      <button
                        type="button"
                        className="btn btn-sm btn-success"
                        onClick={() => saveEditedMessage(c.id)}
                      >
                        <i className="bi bi-check-lg"></i>
                      </button>
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-secondary"
                        onClick={() => setEditingId(null)}
                      >
                        <i className="bi bi-x-lg"></i>
                      </button>
                    </div>
                  ) : (
                    <p className="small text-muted mb-0 fst-italic">
                      "{c.custom_message || '¡Buenos días! Te deseamos un excelente día.'}"
                      <button
                        type="button"
                        className="btn btn-link btn-sm text-decoration-none p-0 ms-2 small"
                        onClick={() => {
                          setEditingId(c.id);
                          setEditingMessage(c.custom_message || '');
                        }}
                      >
                        <i className="bi bi-pencil me-1"></i>Editar
                      </button>
                    </p>
                  )}
                </div>

                {/* Acciones y Toggle */}
                <div className="d-flex align-items-center gap-2 align-self-end align-self-md-center">
                  <button
                    type="button"
                    onClick={() => toggleStatus(c.id, c.is_active)}
                    className={`btn btn-sm rounded-pill px-3 fw-semibold d-flex align-items-center gap-2 ${
                      c.is_active 
                        ? 'btn-success-subtle text-success border-success-subtle' 
                        : 'btn-secondary-subtle text-secondary border-secondary-subtle'
                    }`}
                  >
                    <i className={`bi bi-circle-fill ${c.is_active ? 'text-success' : 'text-secondary'}`} style={{ fontSize: '0.5rem' }}></i>
                    {c.is_active ? 'ACTIVO' : 'PAUSADO'}
                  </button>
                  {/* Botón para probar envío */}
                  <button
                    type="button"
                    onClick={() => handleSendTest(c)}
                    disabled={testingId === c.id}
                    className="btn btn-outline-success btn-sm d-flex align-items-center gap-1"
                    title="Probar envío ahora"
                  >
                    {testingId === c.id ? (
                      <>
                        <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                        <span className="d-none d-sm-inline">Enviando...</span>
                      </>
                    ) : (
                      <>
                        <i className="bi bi-send-fill"></i>
                        <span className="d-none d-sm-inline">Probar</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => deleteContact(c.id)}
                    className="btn btn-outline-danger btn-sm border-0"
                    title="Eliminar contacto"
                  >
                    <i className="bi bi-trash3"></i>
                  </button>
                </div>

              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}