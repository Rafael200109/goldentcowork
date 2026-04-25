import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from "@/components/ui/badge";
import {
  Star, Search, Calendar, MapPin, Building2,
  Clock, Microscope, BadgeCheck,
  Zap, Users, Smile, ScanLine, Syringe, Puzzle, BadgeDollarSign,
} from 'lucide-react';
import { supabaseClient } from '@/config/supabaseConfig';
import LazyImage from '@/components/ui/LazyImage';

/* ─────────────────────────────────────────────
    FeaturedClinicCard - CORREGIDO
───────────────────────────────────────────── */
const FeaturedClinicCard = ({ clinic }) => {
  const coverPhoto =
    clinic.clinic_photos?.find(p => p.is_cover)?.photo_url ||
    'https://images.unsplash.com/photo-1629909613654-28e377c37b09?q=80&w=600&auto=format&fit=crop';

  return (
    // Agregamos max-w-[350px] para que la tarjeta no sea tan grande y mx-auto para centrarla
    <Link to={`/book-clinic/${clinic.id}`} className="block h-full max-w-[350px] mx-auto w-full">
      <Card className="h-full overflow-hidden border-border/50 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 bg-card flex flex-col">

        {/* Contenedor de imagen: Eliminamos cualquier margen interno */}
        <div className="relative w-full aspect-video overflow-hidden bg-muted">
          <LazyImage
            src={coverPhoto}
            alt={clinic.name}
            // w-full h-full + object-cover asegura que llene el espacio sin dejar huecos
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 hover:scale-105"
            context="card"
            priority={true}
          />
          <div className="absolute top-3 right-3 z-10">
            <Badge className="bg-background/95 backdrop-blur-sm text-primary shadow-sm border border-border/50 font-bold py-1">
              <Star className="w-3 h-3 text-amber-500 fill-amber-500 mr-1" /> Destacado
            </Badge>
          </div>
        </div>

        <CardContent className="p-4 flex-1 flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-lg text-foreground mb-1 line-clamp-1">{clinic.name}</h3>
            <div className="flex items-center text-muted-foreground text-xs mb-3">
              <MapPin className="w-3.5 h-3.5 mr-1 text-primary shrink-0" />
              <span className="truncate">{clinic.address_city}, {clinic.address_province}</span>
            </div>
          </div>

          <div className="flex flex-wrap gap-1.5 pt-2 border-t border-border/40">
            <Badge variant="secondary" className="font-semibold bg-primary/5 text-primary border-primary/15 text-[9px] uppercase tracking-wider px-1.5">Rayos X</Badge>
            <Badge variant="secondary" className="font-semibold bg-primary/5 text-primary border-primary/15 text-[9px] uppercase tracking-wider px-1.5">Esterilización</Badge>
            <Badge variant="secondary" className="font-semibold bg-primary/5 text-primary border-primary/15 text-[9px] uppercase tracking-wider px-1.5">WiFi</Badge>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};

/* ─────────────────────────────────────────────
    HeroVisuals
───────────────────────────────────────────── */
const HeroVisuals = () => (
  <div className="relative w-full max-w-lg mx-auto lg:ml-auto flex items-center justify-center py-8">
    <div
      className="absolute inset-0 bg-gradient-to-tr from-primary/20 via-secondary/10 to-transparent rounded-full blur-3xl opacity-70 animate-pulse"
      style={{ animationDuration: '4s' }}
    />
    <div className="relative z-10 grid grid-cols-2 gap-4 p-8 bg-background/70 backdrop-blur-md rounded-3xl border border-border/50 shadow-2xl transform rotate-3 hover:rotate-0 transition-transform duration-500">
      <div className="bg-primary/10 p-6 rounded-2xl flex flex-col items-center justify-center gap-2 h-32 w-32 shadow-inner">
        <Puzzle className="w-10 h-10 text-primary" />
        <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider text-center leading-tight">Salud Oral</span>
      </div>
      <div className="bg-secondary/10 p-6 rounded-2xl flex flex-col items-center justify-center gap-2 h-32 w-32 shadow-inner mt-8">
        <ScanLine className="w-10 h-10 text-secondary" />
        <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider text-center leading-tight">Rayos X</span>
      </div>
      <div className="bg-accent p-6 rounded-2xl flex flex-col items-center justify-center gap-2 h-32 w-32 shadow-inner -mt-8">
        <Syringe className="w-10 h-10 text-foreground" />
        <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider text-center leading-tight">Instrumental</span>
      </div>
      <div className="bg-primary p-6 rounded-2xl flex flex-col items-center justify-center gap-2 h-32 w-32 shadow-inner">
        <BadgeCheck className="w-10 h-10 text-primary-foreground" />
        <span className="text-[10px] font-medium text-primary-foreground/70 uppercase tracking-wider text-center leading-tight">Verificado</span>
      </div>
    </div>
  </div>
);

/* ─────────────────────────────────────────────
    MAIN PAGE
───────────────────────────────────────────── */
export function GuestHome() {
  const [clinics, setClinics] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const { data: featuredData } = await supabaseClient
          .from('clinics')
          .select('*, clinic_photos(*)')
          .eq('status', 'published')
          .eq('is_featured', true)
          .limit(4); // Aumentado a 4 para llenar el nuevo grid
        if (featuredData) setClinics(featuredData);
      } catch (error) {
        console.error('Error fetching featured clinics:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="overflow-x-hidden min-h-screen">
      {/* ── HERO ──────────────────────────────────── */}
      <section className="relative pt-4 pb-20 lg:pt-8 lg:pb-28 overflow-hidden bg-gradient-to-b from-background via-accent/20 to-background">
        <div className="container px-4 md:px-6">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="text-center lg:text-left space-y-6 z-10">
              <div className="inline-flex items-center rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-sm font-medium text-primary">
                <Zap className="mr-2 h-4 w-4" /> La red dental #1
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-7xl font-extrabold tracking-tight leading-tight">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">
                  Tu espacio ideal,<br />
                  cuando lo necesitas.
                </span>
              </h1>
              <p className="text-lg text-muted-foreground max-w-[600px] mx-auto lg:mx-0">
                Conectamos odontólogos independientes con clínicas de primer nivel para renta de consultorios por horas. Rápido, seguro y sin complicaciones.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start pt-2">
                <Link to="/search-clinics">
                  <Button size="lg" className="h-14 px-8 text-base shadow-lg hover:shadow-primary/25 transition-all">
                    <Search className="mr-2 h-5 w-5" /> Buscar Consultorio
                  </Button>
                </Link>
                <Link to="/register">
                  <Button size="lg" variant="outline" className="h-14 px-8 text-base">
                    Registra tu clínica
                  </Button>
                </Link>
              </div>
            </div>
            <HeroVisuals />
          </div>
        </div>
      </section>

      {/* ── ESPACIOS DESTACADOS CORREGIDO ───────────────────── */}
      <section className="relative pt-4 pb-20 lg:pt-4 lg:pb-28 bg-background border-t border-border/50">
        <div className="container px-4">
          <div className="flex flex-col md:flex-row justify-between items-end mb-10 gap-4">
            <div>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight leading-tight text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">
                Espacios Destacados
              </h2>
              <p className="text-muted-foreground">Clínicas verificadas con excelentes instalaciones</p>
            </div>
            <Link to="/search-clinics">
              <Button variant="outline">Ver todas las clínicas</Button>
            </Link>
          </div>

          {/* GRID ACTUALIZADO: Agregado xl:grid-cols-4 y reducido el gap a 6 */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="max-w-[350px] mx-auto w-full">
                  <Skeleton className="aspect-video w-full rounded-2xl mb-4" />
                  <Skeleton className="h-6 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              ))}
            </div>
          ) : clinics.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {clinics.map(clinic => <FeaturedClinicCard key={clinic.id} clinic={clinic} />)}
            </div>
          ) : (
            <div className="text-center py-12 bg-muted/30 rounded-2xl border border-dashed">
              <Building2 className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No hay clínicas destacadas en este momento.</p>
            </div>
          )}
        </div>
      </section>

      {/* ── CÓMO FUNCIONA ─────────────────────────── */}
      <section className="py-20 bg-white border-t border-[#e8e6e3]">
        <div className="container px-4">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-3xl font-bold mb-3" style={{ color: '#364027' }}>¿Cómo funciona?</h2>
            <p className="text-muted-foreground">En tres pasos sencillos tendrás tu consultorio listo para atender pacientes.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { number: '01', icon: Search, title: 'Encuentra tu espacio', desc: 'Busca clínicas por ubicación, disponibilidad y equipamiento.' },
              { number: '02', icon: Calendar, title: 'Reserva por horas', desc: 'Selecciona el horario que te conviene y reserva en segundos.' },
              { number: '03', icon: BadgeDollarSign, title: 'Atiende y factura', desc: 'Llega, trabaja en un consultorio equipado y cobra.' },
            ].map(s => (
              <div key={s.number} className="flex gap-5 items-start p-6 bg-white rounded-2xl border border-[#e8e6e3] shadow-sm hover:shadow-md transition-all">
                <div className="flex flex-col items-center gap-3 min-w-[52px]">
                  <span className="font-extrabold text-4xl leading-none" style={{ color: '#e3793f33' }}>{s.number}</span>
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center shadow-md flex-shrink-0" style={{ backgroundColor: '#e3793f' }}>
                    <s.icon className="w-5 h-5 text-white" />
                  </div>
                </div>
                <div>
                  <h3 className="font-bold text-lg mb-1" style={{ color: '#364027' }}>{s.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SIMPLIFICA TU VIDA PROFESIONAL ───────── */}
      <section className="py-20 bg-white border-t border-[#e8e6e3]">
        <div className="container px-4">
          <div className="rounded-3xl border border-[#e8e6e3] p-10 md:p-14 shadow-sm" style={{ backgroundColor: '#e8e6e333' }}>
            <div className="grid md:grid-cols-[1fr_2fr] gap-12 items-start">
              <div>
                <h2 className="text-3xl font-bold mb-3 leading-tight" style={{ color: '#364027' }}>
                  Simplifica tu vida profesional
                </h2>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Olvídate de los costos fijos. Renta solo el tiempo que necesitas.
                </p>
              </div>
              <div className="grid sm:grid-cols-2 gap-8">
                {[
                  { icon: MapPin, title: 'Ubicaciones Estratégicas', desc: 'Accede a clínicas en zonas céntricas e ideales.' },
                  { icon: Clock, title: 'Gestión Flexible', desc: 'Reserva por horas según tu conveniencia.' },
                  { icon: Microscope, title: 'Equipo de Primer Nivel', desc: 'Consultorios con equipamiento completo.' },
                  { icon: BadgeCheck, title: 'Clínicas Verificadas', desc: 'Proceso de verificación riguroso.' },
                ].map(f => (
                  <div key={f.title} className="flex flex-col gap-3">
                    <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#36402715' }}>
                      <f.icon className="w-5 h-5" style={{ color: '#364027' }} />
                    </div>
                    <h3 className="font-bold text-base" style={{ color: '#364027' }}>{f.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}