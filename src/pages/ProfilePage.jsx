import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useUser } from '@/contexts/UserContext';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { supabase } from '@/lib/customSupabaseClient';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Loader2, Edit, LogOut, ShieldCheck, FileText, User, Briefcase, Calendar, Building, Info, Camera, Landmark, PlusCircle } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import EditProfileDialog from '@/components/auth/EditProfileDialog';
import DentistDocuments from '@/components/auth/DentistDocuments';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import BookingChatButton from '@/components/chat/BookingChatButton';
import HostBankAccountDisplay from '@/components/auth/HostBankAccountDisplay';
import HostBankAccountModal from '@/components/auth/HostBankAccountModal';
import { useHostBankAccount } from '@/hooks/useHostBankAccount';

const InfoRow = ({ icon, label, value }) => (
  <div className="flex items-start py-3">
    <div className="w-8 mr-4 text-muted-foreground">{icon}</div>
    <div>
      <p className="text-sm font-medium text-muted-foreground">{label}</p>
      <p className="font-semibold text-foreground">{value || 'No especificado'}</p>
    </div>
  </div>
);

const BookingCard = ({ booking, onInvoiceClick, currentUserId }) => {
  const isHost = currentUserId === booking.clinic?.host_id;

  return (
    <Card className="hover:shadow-sm transition-shadow">
      <CardContent className="p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex-grow">
          <p className="font-semibold">{booking.clinic?.name}</p>
          <p className="text-sm text-muted-foreground">
            {format(parseISO(booking.start_time), "d MMM yyyy 'a las' HH:mm", { locale: es })}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full sm:w-auto">
          <span className={`text-sm font-medium capitalize px-2 py-1 rounded-md self-start sm:self-auto ${
              booking.status === 'confirmed' ? 'bg-green-100 text-green-800' :
              booking.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
              'bg-gray-100 text-gray-800'
          }`}>
              {booking.status}
          </span>
          <div className="flex gap-2 w-full sm:w-auto">
              <Button variant="outline" size="sm" onClick={() => onInvoiceClick(booking.id)} className="flex-1 sm:flex-none">
                  <FileText className="w-4 h-4 mr-2" />
                  Factura
              </Button>
              <BookingChatButton booking={booking} className="flex-1 sm:flex-none" isHost={isHost} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const ProfilePage = () => {
  const { profile, loadingProfile, refreshProfile } = useUser();
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const avatarInputRef = useRef(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [bookings, setBookings] = useState([]);
  const [loadingBookings, setLoadingBookings] = useState(true);

  // Bank account hooks
  const { account: bankAccount, fetchAccount: fetchBankAccount, deleteAccount: deleteBankAccount, loading: bankLoading } = useHostBankAccount();
  const [isBankModalOpen, setIsBankModalOpen] = useState(false);
  const [isDeletingBank, setIsDeletingBank] = useState(false);

  useEffect(() => {
    const fetchBookings = async () => {
      if (!user) return;
      setLoadingBookings(true);
      try {
        const { data, error } = await supabase
          .from('bookings')
          .select('*, clinic:clinics!bookings_clinic_id_fkey(name, host_id)')
          .eq('dentist_id', user.id)
          .order('start_time', { ascending: false })
          .limit(5);

        if (error) throw error;
        setBookings(data);
      } catch (error) {
        toast({ variant: 'destructive', title: 'Error', description: 'No se pudieron cargar las reservas.' });
      } finally {
        setLoadingBookings(false);
      }
    };

    fetchBookings();
  }, [user, toast]);

  useEffect(() => {
    if (profile?.role === 'clinic_host') {
      fetchBankAccount();
    }
  }, [profile?.role, fetchBankAccount]);

  const handleProfileUpdate = () => {
    refreshProfile();
  };
  
  const handleAvatarClick = () => {
    avatarInputRef.current.click();
  };

  const handleAvatarUpload = async (event) => {
    const file = event.target.files[0];
    if (!file || !user) return;

    setUploadingAvatar(true);
    try {
      const filePath = `${user.id}/avatar-${Date.now()}`;
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, {
          upsert: true,
        });

      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage.from('avatars').getPublicUrl(filePath);
      const newAvatarUrl = publicUrlData.publicUrl;

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: newAvatarUrl })
        .eq('id', user.id);
      
      if (updateError) throw updateError;
      
      await refreshProfile();
      
      toast({
        title: '¡Foto de perfil actualizada!',
        description: 'Tu nueva foto de perfil se ha guardado.',
      });

    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error al subir la imagen',
        description: error.message,
      });
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleInvoiceClick = (bookingId) => {
    navigate(`/invoice/${bookingId}`);
  };

  const handleDeleteBank = async () => {
    setIsDeletingBank(true);
    try {
      await deleteBankAccount();
      toast({ title: 'Cuenta eliminada', description: 'Se ha eliminado la cuenta bancaria de tu perfil.' });
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'No se pudo eliminar la cuenta.' });
    } finally {
      setIsDeletingBank(false);
    }
  };

  if (loadingProfile || !profile) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  const {
    full_name, avatar_url, email, phone, role,
    dentist_id_document_number, dentist_university, dentist_specialty,
    documentation_status, host_rnc, host_legal_name
  } = profile;

  const getInitials = (name) => {
    if (!name) return '?';
    const names = name.split(' ');
    if (names.length > 1) {
      return `${names[0][0]}${names[names.length - 1][0]}`;
    }
    return name.substring(0, 2);
  };

  const isDentist = role === 'dentist';
  const isHost = role === 'clinic_host';

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-4xl mx-auto">
      <Card className="w-full glassmorphism">
        <CardHeader className="text-center items-center relative">
           <div className="relative group">
            <Avatar className="w-24 h-24 mb-4 border-4 border-background shadow-lg">
              <AvatarImage src={avatar_url} alt={full_name} key={avatar_url} />
              <AvatarFallback className="text-3xl bg-primary/20">{getInitials(full_name)}</AvatarFallback>
            </Avatar>
             <div 
               className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer mb-4"
               onClick={handleAvatarClick}
             >
               {uploadingAvatar ? (
                 <Loader2 className="w-8 h-8 text-white animate-spin" />
               ) : (
                 <Camera className="w-8 h-8 text-white" />
               )}
             </div>
             <input
               type="file"
               ref={avatarInputRef}
               onChange={handleAvatarUpload}
               className="hidden"
               accept="image/png, image/jpeg, image/gif"
             />
          </div>
          <CardTitle className="text-3xl font-bold gradient-text">{full_name}</CardTitle>
          <CardDescription className="text-muted-foreground">{email}</CardDescription>
          <div className="absolute top-4 right-4 flex gap-2">
            <Button variant="outline" size="icon" onClick={() => setIsEditOpen(true)}>
              <Edit className="w-4 h-4" />
            </Button>
            <Button variant="destructive" size="icon" onClick={signOut}>
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="personal-info" className="w-full">
            <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4">
              <TabsTrigger value="personal-info"><User className="w-4 h-4 mr-2"/>Info Personal</TabsTrigger>
              {isDentist && <TabsTrigger value="professional-info"><Briefcase className="w-4 h-4 mr-2"/>Info Profesional</TabsTrigger>}
              {isHost && <TabsTrigger value="host-info"><Building className="w-4 h-4 mr-2"/>Info Anfitrión</TabsTrigger>}
              {isDentist && <TabsTrigger value="documents"><ShieldCheck className="w-4 h-4 mr-2"/>Documentos</TabsTrigger>}
              {isDentist && <TabsTrigger value="bookings"><Calendar className="w-4 h-4 mr-2"/>Reservas</TabsTrigger>}
            </TabsList>
            
            <TabsContent value="personal-info" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Información Personal</CardTitle>
                </CardHeader>
                <CardContent className="divide-y">
                  <InfoRow icon={<User />} label="Nombre Completo" value={full_name} />
                  <InfoRow icon={<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-at-sign"><circle cx="12" cy="12" r="4"/><path d="M16 8v5a3 3 0 0 0 6 0v-1a10 10 0 1 0-4 8"/></svg>} label="Email" value={email} />
                  <InfoRow icon={<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-phone"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>} label="Teléfono" value={phone} />
                  <InfoRow icon={<Info />} label="Rol" value={role} />
                </CardContent>
              </Card>
            </TabsContent>

            {isDentist && (
              <TabsContent value="professional-info" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Información Profesional de Odontólogo</CardTitle>
                  </CardHeader>
                  <CardContent className="divide-y">
                    <InfoRow icon={<FileText />} label="Cédula" value={dentist_id_document_number} />
                    <InfoRow icon={<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-graduation-cap"><path d="M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.084a1 1 0 0 0 0 1.838l8.57 3.908a2 2 0 0 0 1.66 0z"/><path d="M22 10v6"/><path d="M6 12.5V16a6 3 0 0 0 12 0v-3.5"/></svg>} label="Universidad" value={dentist_university} />
                    <InfoRow icon={<Briefcase />} label="Especialidad" value={dentist_specialty} />
                  </CardContent>
                </Card>
              </TabsContent>
            )}
            
            {isHost && (
              <TabsContent value="host-info" className="mt-6 space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Información de Anfitrión</CardTitle>
                  </CardHeader>
                  <CardContent className="divide-y">
                    <InfoRow icon={<FileText />} label="RNC" value={host_rnc} />
                    <InfoRow icon={<Building />} label="Razón Social" value={host_legal_name} />
                  </CardContent>
                </Card>

                <Card className="border-primary/10">
                  <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Landmark className="w-5 h-5 text-primary" />
                        Cuenta Bancaria para Pagos
                      </CardTitle>
                      <CardDescription className="mt-1">
                        Esta cuenta se utilizará para depositarte los ingresos por reservas.
                      </CardDescription>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-4">
                    {bankLoading ? (
                      <div className="flex justify-center p-4"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
                    ) : bankAccount ? (
                      <HostBankAccountDisplay 
                        account={bankAccount} 
                        onEdit={() => setIsBankModalOpen(true)} 
                        onDelete={handleDeleteBank}
                        isDeleting={isDeletingBank}
                      />
                    ) : (
                      <div className="text-center p-6 border-2 border-dashed rounded-lg bg-muted/20">
                        <p className="text-muted-foreground mb-4">No tienes ninguna cuenta bancaria registrada.</p>
                        <Button onClick={() => setIsBankModalOpen(true)}>
                          <PlusCircle className="w-4 h-4 mr-2" /> Añadir Cuenta
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            )}
            
            {isDentist && (
              <TabsContent value="documents" className="mt-6">
                <DentistDocuments user={user} onUploadComplete={refreshProfile} />
              </TabsContent>
            )}

            {isDentist && (
              <TabsContent value="bookings" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Reservas Recientes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {loadingBookings ? (
                      <div className="flex justify-center py-8"><Loader2 className="w-8 h-8 animate-spin" /></div>
                    ) : bookings.length > 0 ? (
                      <div className="space-y-4">
                        {bookings.map(b => <BookingCard key={b.id} booking={b} onInvoiceClick={handleInvoiceClick} currentUserId={user.id} />)}
                      </div>
                    ) : (
                      <p className="text-center text-muted-foreground py-8">No tienes reservas recientes.</p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            )}
            
          </Tabs>
        </CardContent>
      </Card>

      <EditProfileDialog
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
        profileData={profile}
        onProfileUpdate={handleProfileUpdate}
      />
      
      {isHost && (
        <HostBankAccountModal 
          open={isBankModalOpen} 
          onOpenChange={setIsBankModalOpen} 
          account={bankAccount} 
          onSuccess={fetchBankAccount} 
        />
      )}
    </motion.div>
  );
};

export default ProfilePage;