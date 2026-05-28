import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  CalendarDays,
  DollarSign,
  Clock,
  Search,
  Trash2,
  Plus,
} from "lucide-react";

import html2canvas from "html2canvas";
import { supabase } from "./supabase";
import "./App.css";

const empleados = [
  "Alex",
  "Cristhian",
  "Jose",
  "Julian",
  "Sebastian",
  "Luisa",
];

export default function App() {
  const today = new Date().toISOString().slice(0, 10);

  const comprobanteRef = useRef();

  const [reservaSeleccionada, setReservaSeleccionada] = useState(null);

  const [reservas, setReservas] = useState([]);

  const [form, setForm] = useState({
    cliente: "",
    telefono: "",
    patente: "",
    vehiculo: "Auto",
    marca: "",
    fechaIngreso: today,
    fechaEgreso: today,
    horaIngreso: "",
    horaEgreso: "",
    tipoTicket: "Sistema",
    empleado: "Sebastian",
    estado: "Reservado",
    pago: "Pendiente",
    monto: "",
    notas: "",
  });

  const [busqueda, setBusqueda] = useState("");
  const [fechaFiltro, setFechaFiltro] = useState(today);

  // CARGAR RESERVAS
  useEffect(() => {
    cargarReservas();
  }, []);

  const cargarReservas = async () => {
    const { data, error } = await supabase
      .from("reservas")
      .select("*")
      .order("fecha_ingreso", { ascending: false });

    if (error) {
      console.log(error);
      return;
    }

    const reservasFormateadas = data.map((r) => ({
      id: r.id,
      cliente: r.cliente,
      telefono: r.telefono,
      patente: r.patente,
      vehiculo: r.vehiculo,
      marca: r.marca,
      fechaIngreso: r.fecha_ingreso,
      fechaEgreso: r.fecha_egreso,
      horaIngreso: r.hora_ingreso,
      horaEgreso: r.hora_egreso,
      tipoTicket: r.tipo_ticket,
      empleado: r.empleado,
      estado: r.estado,
      pago: r.pago,
      monto: r.monto,
      notas: r.notas,
    }));

    setReservas(reservasFormateadas);
  };

  const reservasFiltradas = useMemo(() => {
    return reservas.filter((r) => {
      const texto =
        `${r.cliente} ${r.telefono} ${r.patente} ${r.marca}`.toLowerCase();

      return (
        texto.includes(busqueda.toLowerCase()) &&
        r.fechaIngreso === fechaFiltro
      );
    });
  }, [reservas, busqueda, fechaFiltro]);

  const cobrado = reservasFiltradas
    .filter((r) => r.pago === "Pagado")
    .reduce((a, r) => a + Number(r.monto || 0), 0);

  const pendiente = reservasFiltradas
    .filter((r) => r.pago === "Pendiente")
    .reduce((a, r) => a + Number(r.monto || 0), 0);

  // GUARDAR
  const guardar = async () => {
    if (
      !form.cliente ||
      !form.patente ||
      !form.fechaIngreso ||
      !form.horaIngreso
    ) {
      alert("Completá los campos obligatorios.");
      return;
    }

    const nuevaReserva = {
      cliente: form.cliente,
      telefono: form.telefono,
      patente: form.patente,
      vehiculo: form.vehiculo,
      marca: form.marca,
      fecha_ingreso: form.fechaIngreso,
      fecha_egreso: form.fechaEgreso,
      hora_ingreso: form.horaIngreso,
      hora_egreso: form.horaEgreso,
      tipo_ticket: form.tipoTicket,
      empleado: form.empleado,
      estado: form.estado,
      pago: form.pago,
      monto: form.monto === "" ? 0 : Number(form.monto),
      notas: form.notas,
    };

    const { error } = await supabase
      .from("reservas")
      .insert([nuevaReserva]);

    if (error) {
      console.log(error);
      alert("Error guardando reserva");
      return;
    }

    await cargarReservas();

    limpiarFormulario();
  };

  const limpiarFormulario = () => {
    setForm({
      cliente: "",
      telefono: "",
      patente: "",
      vehiculo: "Auto",
      marca: "",
      fechaIngreso: today,
      fechaEgreso: today,
      horaIngreso: "",
      horaEgreso: "",
      tipoTicket: "Sistema",
      empleado: "Sebastian",
      estado: "Reservado",
      pago: "Pendiente",
      monto: "",
      notas: "",
    });
  };

  // ELIMINAR
  const eliminar = async (id) => {
    if (!confirm("¿Eliminar reserva?")) return;

    const { error } = await supabase
      .from("reservas")
      .delete()
      .eq("id", id);

    if (error) {
      alert("Error eliminando");
      return;
    }

    await cargarReservas();
  };

  // WHATSAPP
  const enviarWhatsApp = (r) => {
    const numero = r.telefono.replace(/\D/g, "");

    const mensaje = `
Hola ${r.cliente}, tu reserva en Parking Thames 350 fue confirmada 🚗

📅 Fecha ingreso: ${r.fechaIngreso}
🕒 Hora ingreso: ${r.horaIngreso}

🚘 Vehículo: ${r.vehiculo}
🏷️ Marca/modelo: ${r.marca}
🔑 Patente: ${r.patente}

💰 Monto: $${r.monto}

📍 Thames 350 - Villa Crespo

¡Te esperamos!
`;

    window.open(
      `https://wa.me/54${numero}?text=${encodeURIComponent(mensaje)}`,
      "_blank"
    );
  };

  // COMPROBANTE
  const descargarComprobante = async (r) => {
    setReservaSeleccionada(r);

    setTimeout(async () => {
      const canvas = await html2canvas(comprobanteRef.current);

      const link = document.createElement("a");

      link.download = `reserva-${r.patente}.png`;

      link.href = canvas.toDataURL();

      link.click();
    }, 300);
  };

  return (
    <div className="page">
      <header className="top">
        <div>
          <h1>Reservas Parking Thames 350</h1>
          <p>Gestión simple de reservas, pagos e ingresos.</p>
        </div>

        <div className="date-pill">
          <CalendarDays size={16} />
          {fechaFiltro}
        </div>
      </header>

      <section className="stats stats-three">
        <div className="stat">
          <div className="icon blue">
            <CalendarDays size={30} />
          </div>

          <div>
            <span>Reservas totales</span>
            <strong>{reservasFiltradas.length}</strong>
          </div>
        </div>

        <div className="stat">
          <div className="icon purple">
            <DollarSign size={30} />
          </div>

          <div>
            <span>Cobrado</span>
            <strong>${cobrado.toLocaleString("es-AR")}</strong>
          </div>
        </div>

        <div className="stat">
          <div className="icon orange">
            <Clock size={28} />
          </div>

          <div>
            <span>Pendiente</span>
            <strong>${pendiente.toLocaleString("es-AR")}</strong>
          </div>
        </div>
      </section>

      <main className="content">
        <section className="card form-card">
          <h2>
            <Plus size={22} /> Nueva reserva
          </h2>

          <input
            placeholder="Cliente *"
            value={form.cliente}
            onChange={(e) =>
              setForm({ ...form, cliente: e.target.value })
            }
          />

          <input
            placeholder="Teléfono"
            value={form.telefono}
            onChange={(e) =>
              setForm({ ...form, telefono: e.target.value })
            }
          />

          <div className="two">
            <select
              value={form.vehiculo}
              onChange={(e) =>
                setForm({ ...form, vehiculo: e.target.value })
              }
            >
              <option>Auto</option>
              <option>SUV</option>
              <option>Camioneta</option>
              <option>Moto</option>
            </select>

            <input
              placeholder="Patente *"
              value={form.patente}
              onChange={(e) =>
                setForm({ ...form, patente: e.target.value })
              }
            />
          </div>

          <input
            placeholder="Marca / tipo de auto"
            value={form.marca}
            onChange={(e) =>
              setForm({ ...form, marca: e.target.value })
            }
          />

          <div className="two labels">
            <label>Fecha ingreso *</label>
            <label>Fecha egreso *</label>

            <input
              type="date"
              value={form.fechaIngreso}
              onChange={(e) =>
                setForm({
                  ...form,
                  fechaIngreso: e.target.value,
                })
              }
            />

            <input
              type="date"
              value={form.fechaEgreso}
              onChange={(e) =>
                setForm({
                  ...form,
                  fechaEgreso: e.target.value,
                })
              }
            />
          </div>

          <div className="two labels">
            <label>Hora ingreso *</label>
            <label>Hora egreso</label>

            <input
              type="time"
              value={form.horaIngreso}
              onChange={(e) =>
                setForm({
                  ...form,
                  horaIngreso: e.target.value,
                })
              }
            />

            <input
              type="time"
              value={form.horaEgreso}
              onChange={(e) =>
                setForm({
                  ...form,
                  horaEgreso: e.target.value,
                })
              }
            />
          </div>

          <div className="two">
            <input
              type="number"
              placeholder="Monto"
              value={form.monto}
              onChange={(e) =>
                setForm({ ...form, monto: e.target.value })
              }
            />

            <select
              value={form.tipoTicket}
              onChange={(e) =>
                setForm({
                  ...form,
                  tipoTicket: e.target.value,
                })
              }
            >
              <option>Sistema</option>
              <option>Manual</option>
            </select>
          </div>

          <select
            value={form.empleado}
            onChange={(e) =>
              setForm({
                ...form,
                empleado: e.target.value,
              })
            }
          >
            {empleados.map((emp) => (
              <option key={emp}>{emp}</option>
            ))}
          </select>

          <textarea
            placeholder="Notas"
            value={form.notas}
            onChange={(e) =>
              setForm({ ...form, notas: e.target.value })
            }
          />

          <button className="save" onClick={guardar}>
            Guardar reserva
          </button>
        </section>

        <section className="card list-card">
          <div className="list-title">
            <h2>Reservas del día</h2>

            <div className="filters">
              <div className="search">
                <Search size={16} />

                <input
                  placeholder="Buscar..."
                  value={busqueda}
                  onChange={(e) =>
                    setBusqueda(e.target.value)
                  }
                />
              </div>

              <input
                type="date"
                value={fechaFiltro}
                onChange={(e) =>
                  setFechaFiltro(e.target.value)
                }
              />
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>Cliente</th>
                <th>Vehículo</th>
                <th>Ingreso</th>
                <th>Monto</th>
                <th>Comprobante</th>
                <th>WhatsApp</th>
                <th></th>
              </tr>
            </thead>

            <tbody>
              {reservasFiltradas.map((r) => (
                <tr key={r.id}>
                  <td>
                    <b>{r.cliente}</b>
                    <br />
                    <small>{r.telefono}</small>
                  </td>

                  <td>
                    {r.vehiculo}
                    <br />
                    <small>{r.marca}</small>
                  </td>

                  <td>
                    {r.fechaIngreso}
                    <br />
                    <small>{r.horaIngreso}</small>
                  </td>

                  <td>${r.monto}</td>

                  <td>
                    <button
                      className="voucher-btn"
                      onClick={() =>
                        descargarComprobante(r)
                      }
                    >
                      Comprobante
                    </button>
                  </td>

                  <td>
                    <button
                      className="wa-btn"
                      onClick={() =>
                        enviarWhatsApp(r)
                      }
                    >
                      WhatsApp
                    </button>
                  </td>

                  <td>
                    <button
                      className="trash"
                      onClick={() => eliminar(r.id)}
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </main>

      {reservaSeleccionada && (
        <div className="hidden-render">
          <div className="simple-voucher" ref={comprobanteRef}>
            <div className="simple-header">
              <h1>PARKING THAMES 350</h1>
            </div>

            <div className="simple-body">
              <h2>COMPROBANTE DE RESERVA</h2>
              <h3>CONFIRMADA</h3>

              <div className="simple-row">
                <span>Cliente:</span>
                <strong>{reservaSeleccionada.cliente}</strong>
              </div>

              <div className="simple-row">
                <span>Teléfono:</span>
                <strong>{reservaSeleccionada.telefono}</strong>
              </div>

              <div className="simple-row">
                <span>Patente:</span>
                <strong>{reservaSeleccionada.patente}</strong>
              </div>

              <div className="simple-row">
                <span>Vehículo:</span>
                <strong>{reservaSeleccionada.vehiculo}</strong>
              </div>

              <div className="simple-row">
                <span>Marca:</span>
                <strong>{reservaSeleccionada.marca}</strong>
              </div>

              <div className="simple-row">
                <span>Ingreso:</span>
                <strong>
                  {reservaSeleccionada.fechaIngreso}{" "}
                  {reservaSeleccionada.horaIngreso}
                </strong>
              </div>

              <div className="simple-row">
                <span>Egreso:</span>
                <strong>
                  {reservaSeleccionada.fechaEgreso}{" "}
                  {reservaSeleccionada.horaEgreso}
                </strong>
              </div>

              <div className="simple-row">
                <span>Monto:</span>
                <strong>${reservaSeleccionada.monto}</strong>
              </div>

              <div className="simple-confirm">
                RESERVA CONFIRMADA
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}