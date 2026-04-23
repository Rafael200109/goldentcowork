import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image, Font } from '@react-pdf/renderer';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

// Register a font if needed, otherwise standard Helvetica is used by default.
// For professional look, standard fonts work well in PDFs.

const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#FFFFFF',
    padding: 40,
    fontFamily: 'Helvetica',
    fontSize: 10,
    color: '#1F2937', // Gray-800
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    paddingBottom: 20,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logo: {
    width: 40,
    height: 40,
    marginRight: 10,
  },
  brandName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2B391F', // Primary Goldent Green
  },
  invoiceTitleBlock: {
    alignItems: 'flex-end',
  },
  invoiceTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2B391F',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  invoiceNumber: {
    fontSize: 12,
    color: '#6B7280',
  },
  statusBadge: {
    marginTop: 5,
    paddingVertical: 4,
    paddingHorizontal: 8,
    backgroundColor: '#DCFCE7', // Green-100
    borderRadius: 4,
  },
  statusText: {
    color: '#166534', // Green-800
    fontSize: 8,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  
  // Info Grid
  infoContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  infoColumn: {
    width: '45%',
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#9CA3AF', // Gray-400
    textTransform: 'uppercase',
    marginBottom: 8,
    letterSpacing: 1,
  },
  entityName: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  entityText: {
    fontSize: 10,
    marginBottom: 2,
    color: '#4B5563',
  },
  
  // Dates
  datesContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 30,
  },
  dateBox: {
    marginLeft: 20,
    alignItems: 'flex-end',
  },
  
  // Table
  table: {
    flexDirection: 'column',
    marginBottom: 30,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6', // Gray-100
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  colDesc: { width: '50%' },
  colQty: { width: '15%', textAlign: 'center' },
  colPrice: { width: '15%', textAlign: 'right' },
  colTotal: { width: '20%', textAlign: 'right' },
  
  headerText: {
    fontWeight: 'bold',
    fontSize: 9,
    color: '#4B5563',
  },
  rowText: {
    fontSize: 10,
  },
  rowSubText: {
    fontSize: 8,
    color: '#9CA3AF',
    marginTop: 2,
  },
  
  // Totals
  totalsContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  totalsBox: {
    width: '40%',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    paddingVertical: 4,
  },
  totalRowFinal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 2,
    borderTopColor: '#2B391F',
  },
  totalLabel: {
    fontSize: 10,
    color: '#6B7280',
  },
  totalValue: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  finalTotalLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#2B391F',
  },
  finalTotalValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2B391F',
  },
  
  // Footer
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: 'center',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 20,
  },
  footerText: {
    fontSize: 8,
    color: '#9CA3AF',
    marginBottom: 4,
  },
  footerBrand: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#D1D5DB',
  }
});

const InvoicePDF = ({ invoice }) => {
  const { booking, dentist, host } = invoice;
  const duration = booking ? (new Date(booking.end_time) - new Date(booking.start_time)) / (1000 * 60 * 60) : 0;
  const pricePerHour = duration > 0 ? invoice.total / duration : 0;
  
  const logoUrl = "https://storage.googleapis.com/hostinger-horizons-assets-prod/63ef2070-7e9f-47c2-85b6-42a10bded4a0/13b7a79bee570a0a14cc2cb114de4e4d.png";

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            {/* Note: Image requires a valid URL or base64. Using the provided URL. */}
            <Image src={logoUrl} style={styles.logo} />
            <View>
              <Text style={styles.brandName}>Goldent Co Work</Text>
              <Text style={{ fontSize: 8, color: '#6B7280' }}>Conectando Sonrisas</Text>
            </View>
          </View>
          
          <View style={styles.invoiceTitleBlock}>
            <Text style={styles.invoiceTitle}>FACTURA</Text>
            <Text style={styles.invoiceNumber}>#{invoice.invoice_number}</Text>
            <View style={styles.statusBadge}>
              <Text style={styles.statusText}>{invoice.status === 'paid' ? 'PAGADO' : invoice.status}</Text>
            </View>
          </View>
        </View>

        {/* Info Grid */}
        <View style={styles.infoContainer}>
          <View style={styles.infoColumn}>
            <Text style={styles.sectionTitle}>De (Anfitrión)</Text>
            <Text style={styles.entityName}>{host?.host_legal_name || host?.full_name}</Text>
            <Text style={styles.entityText}>{host?.host_rnc ? `RNC: ${host.host_rnc}` : `Doc: ${host?.dentist_id_document_number || 'N/A'}`}</Text>
            <Text style={styles.entityText}>{host?.email}</Text>
            {booking?.clinic && (
              <Text style={styles.entityText}>
                {booking.clinic.name}
                {"\n"}
                {booking.clinic.address_street}
              </Text>
            )}
          </View>
          
          <View style={styles.infoColumn}>
            <Text style={styles.sectionTitle}>Para (Odontólogo)</Text>
            <Text style={styles.entityName}>{dentist?.full_name}</Text>
            <Text style={styles.entityText}>{dentist?.dentist_id_document_number ? `Cédula: ${dentist.dentist_id_document_number}` : ''}</Text>
            <Text style={styles.entityText}>{dentist?.email}</Text>
            <Text style={styles.entityText}>{dentist?.phone}</Text>
          </View>
        </View>

        {/* Dates */}
        <View style={styles.datesContainer}>
          <View style={styles.dateBox}>
            <Text style={styles.sectionTitle}>Fecha de Emisión</Text>
            <Text style={styles.rowText}>{format(parseISO(invoice.issue_date), 'dd MMM, yyyy', { locale: es })}</Text>
          </View>
          <View style={styles.dateBox}>
            <Text style={styles.sectionTitle}>Vencimiento</Text>
            <Text style={styles.rowText}>{format(parseISO(invoice.due_date), 'dd MMM, yyyy', { locale: es })}</Text>
          </View>
        </View>

        {/* Table */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <View style={styles.colDesc}><Text style={styles.headerText}>Descripción</Text></View>
            <View style={styles.colQty}><Text style={styles.headerText}>Horas</Text></View>
            <View style={styles.colPrice}><Text style={styles.headerText}>Precio Unit.</Text></View>
            <View style={styles.colTotal}><Text style={styles.headerText}>Total</Text></View>
          </View>
          
          <View style={styles.tableRow}>
             <View style={styles.colDesc}>
               <Text style={styles.rowText}>Alquiler de Consultorio</Text>
               <Text style={styles.rowSubText}>{booking?.clinic?.name}</Text>
               <Text style={styles.rowSubText}>
                 {format(parseISO(booking.start_time), 'dd/MM/yyyy HH:mm')} - {format(parseISO(booking.end_time), 'HH:mm')}
               </Text>
             </View>
             <View style={styles.colQty}><Text style={styles.rowText}>{duration.toFixed(1)}</Text></View>
             <View style={styles.colPrice}><Text style={styles.rowText}>RD${pricePerHour.toFixed(2)}</Text></View>
             <View style={styles.colTotal}><Text style={styles.rowText}>RD${invoice.total.toFixed(2)}</Text></View>
          </View>
        </View>

        {/* Totals */}
        <View style={styles.totalsContainer}>
          <View style={styles.totalsBox}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Subtotal</Text>
              <Text style={styles.totalValue}>RD${invoice.subtotal.toFixed(2)}</Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>ITBIS (18%)</Text>
              <Text style={styles.totalValue}>RD${invoice.taxes.toFixed(2)}</Text>
            </View>
            <View style={styles.totalRowFinal}>
              <Text style={styles.finalTotalLabel}>TOTAL PAGADO</Text>
              <Text style={styles.finalTotalValue}>RD${invoice.total.toFixed(2)}</Text>
            </View>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Gracias por confiar en Goldent Co Work.
          </Text>
          <Text style={styles.footerText}>
            Si tienes dudas sobre esta factura, contacta a soporte@goldentcowork.com
          </Text>
          <Text style={styles.footerBrand}>Goldent Co Work Platform</Text>
        </View>

      </Page>
    </Document>
  );
};

export default InvoicePDF;