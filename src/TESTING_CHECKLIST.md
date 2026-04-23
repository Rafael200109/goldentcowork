
# GolDent Co-Work - Comprehensive Testing Checklist

**Version:** 1.0  
**Last Updated:** 2026-04-20  
**Purpose:** Complete QA testing guide for all system functionalities

---

## Table of Contents
1. [Pre-Testing Setup](#pre-testing-setup)
2. [Testing Phases Overview](#testing-phases-overview)
3. [Critical Path Testing](#critical-path-testing)
4. [Module-by-Module Testing](#module-by-module-testing)
5. [Integration Testing](#integration-testing)
6. [End-to-End User Journeys](#end-to-end-user-journeys)
7. [Edge Cases & Boundary Conditions](#edge-cases--boundary-conditions)
8. [Performance & Optimization](#performance--optimization)
9. [Security Testing](#security-testing)
10. [Regression Testing](#regression-testing)

---

## Pre-Testing Setup

### Environment Configuration
- [ ] Verify Node.js version is 20.x
- [ ] Confirm Supabase project is accessible
- [ ] Validate all environment variables are set
- [ ] Test network connectivity to Supabase endpoints
- [ ] Verify storage buckets exist: `avatars`, `clinic_photos`, `dentist_documents`, `user_documents`, `booking_chat_attachments`
- [ ] Confirm RLS policies are active on all tables
- [ ] Validate timezone is set to 'America/Santo_Domingo'

### Test Data Preparation
- [ ] Create test user accounts for each role: `dentist`, `clinic_host`, `admin`, `support`, `accountant`
- [ ] Create at least 5 test clinics with complete data
- [ ] Upload test photos to clinics (minimum 3 per clinic)
- [ ] Create bookings in various states: `pending`, `confirmed`, `cancelled`, `completed`
- [ ] Generate test reviews for clinics
- [ ] Create test support conversations
- [ ] Set up test bank accounts for hosts

---

## Testing Phases Overview

### Phase 1: Unit Testing (Individual Components)
**Priority:** Critical functions first, then UI components  
**Focus:** Isolated functionality without dependencies

### Phase 2: Integration Testing (Module Interactions)
**Priority:** Data flow between connected modules  
**Focus:** API calls, state management, context propagation

### Phase 3: End-to-End Testing (Complete User Flows)
**Priority:** Core business processes  
**Focus:** Real-world scenarios from login to completion

---

## Critical Path Testing

### 🔴 CRITICAL PATH 1: Guest → Registration → Booking → Payment
**Dependencies:** None (Entry point)  
**Priority:** HIGHEST

#### CP1.1: Guest Access & Navigation
- [ ] Load homepage without authentication
- [ ] Verify "Iniciar Sesión" and "Registrarse" buttons visible
- [ ] Navigate to /search-clinics as guest
- [ ] Confirm clinics are visible (published only)
- [ ] Verify login redirect when attempting to favorite/book

#### CP1.2: User Registration (Dentist)
- [ ] Navigate to /register
- [ ] Test form validation:
  - [ ] Empty email shows error
  - [ ] Invalid email format rejected
  - [ ] Password < 6 characters rejected
  - [ ] Passwords mismatch rejected
  - [ ] Missing full_name shows error
  - [ ] Missing phone shows error
- [ ] Submit valid registration form
- [ ] Verify email confirmation sent
- [ ] Confirm user profile created in database
- [ ] Check role assigned correctly (`dentist`)
- [ ] Validate redirect to appropriate page

#### CP1.3: Email Verification
- [ ] Receive confirmation email
- [ ] Click verification link
- [ ] Verify email_confirmed_at updated
- [ ] Test login with unverified email (should still work per config)

#### CP1.4: First Login
- [ ] Enter valid credentials
- [ ] Verify session created
- [ ] Check auth token stored
- [ ] Confirm redirect to /home (logged in version)
- [ ] Validate user profile loaded in UserContext

#### CP1.5: Search & Filter Clinics
- [ ] Search by name (partial match)
- [ ] Filter by province → municipio → sector
- [ ] Sort by price (asc/desc)
- [ ] Filter by availability date
- [ ] Verify results update in real-time
- [ ] Test "Limpiar Filtros" button

#### CP1.6: View Clinic Details
- [ ] Click on clinic card
- [ ] Verify navigation to /book-clinic/:clinicId
- [ ] Confirm all clinic data loads:
  - [ ] Name, description, address
  - [ ] Photo carousel displays
  - [ ] Services list visible
  - [ ] Reviews section shows
  - [ ] Map loads (approximate location for non-bookers)
  - [ ] Price per hour displayed
  - [ ] Host info card visible

#### CP1.7: Select Booking Date & Time
- [ ] Open calendar widget
- [ ] Select future date (today or later)
- [ ] Verify past dates are disabled
- [ ] Select start time from available slots
- [ ] Select end time (must be > start time)
- [ ] Verify duration calculation (hours)
- [ ] Check total price calculation (duration × price_per_hour)
- [ ] Validate minimum booking hours enforced

#### CP1.8: Booking Validation
- [ ] Test error: end time before start time
- [ ] Test error: duration < min_hours_booking
- [ ] Test error: selecting unavailable slot
- [ ] Test error: booking on fully booked day
- [ ] Verify error messages display clearly

#### CP1.9: Open Booking Agreement Dialog
- [ ] Click "Continuar al pago"
- [ ] Verify profile completeness check:
  - [ ] Missing full_name → redirect to profile
  - [ ] Missing dentist_id_document_number → redirect to profile
- [ ] Confirm dialog opens with:
  - [ ] User info displayed
  - [ ] Booking details correct
  - [ ] Terms and conditions visible
  - [ ] Payment form loaded

#### CP1.10: Payment Processing - Cardnet
- [ ] Select "Cardnet" payment method
- [ ] Click "Confirmar y Pagar"
- [ ] Verify pending booking created:
  - [ ] Booking status = 'pending'
  - [ ] Transaction status = 'pending'
  - [ ] expires_at set to 75 minutes from now
- [ ] Confirm WhatsApp redirect occurs
- [ ] Verify booking ID in WhatsApp message
- [ ] Check admin notification sent

#### CP1.11: Payment Processing - PayPal
- [ ] Select "PayPal" payment method
- [ ] PayPal modal opens
- [ ] Complete test payment in sandbox
- [ ] Verify booking confirmed:
  - [ ] Booking status = 'confirmed'
  - [ ] Transaction status = 'succeeded'
  - [ ] Platform fee calculated (25%)
  - [ ] Host payout calculated
- [ ] Confirm invoice generated
- [ ] Check confirmation email sent
- [ ] Verify redirect to /my-bookings

---

### 🔴 CRITICAL PATH 2: Host Registration → Clinic Creation → Booking Management
**Dependencies:** Database, Storage  
**Priority:** HIGH

#### CP2.1: Host Request Submission
- [ ] Existing dentist navigates to /become-host
- [ ] Fill out host request form:
  - [ ] Reason for becoming host
  - [ ] Business information
- [ ] Submit request
- [ ] Verify request saved with status 'pending'
- [ ] Confirm admin notification created

#### CP2.2: Admin Approval of Host Request
- [ ] Admin logs in
- [ ] Navigate to /admin/host-requests
- [ ] View pending request details
- [ ] Approve request
- [ ] Verify user role updated to 'clinic_host'
- [ ] Confirm notification sent to user

#### CP2.3: Clinic Creation (Multi-Step)
- [ ] Navigate to /clinic-dashboard
- [ ] Click "Publicar Clínica"
- [ ] **Step 1 - Basic Info:**
  - [ ] Enter clinic name
  - [ ] Select clinic type
  - [ ] Write description
  - [ ] Upload photos (minimum 1, maximum 20)
  - [ ] Set cover photo
  - [ ] Verify photo upload progress
  - [ ] Test photo deletion
  - [ ] Test photo reordering
- [ ] **Step 2 - Location:**
  - [ ] Enter address details
  - [ ] Use location picker/autocomplete
  - [ ] Verify coordinates saved
  - [ ] Check map preview
- [ ] **Step 3 - Pricing & Services:**
  - [ ] Set price per hour
  - [ ] Set minimum booking hours (≥4)
  - [ ] Select dental services
  - [ ] Select amenities
  - [ ] Set number of cubicles
- [ ] **Step 4 - Policies:**
  - [ ] Write clinic policies (optional)
  - [ ] Set clinic rules (checkboxes)
  - [ ] Review all data
  - [ ] Submit for approval
- [ ] Verify clinic created with status 'pending'

#### CP2.4: Admin Clinic Validation
- [ ] Admin navigates to /admin/clinic-validation
- [ ] View pending clinic
- [ ] Verify all data complete
- [ ] Approve clinic
- [ ] Verify status changed to 'published'
- [ ] Confirm clinic appears in search

#### CP2.5: Host Views Booking Calendar
- [ ] Navigate to /clinic-dashboard
- [ ] Click "Calendario" tab
- [ ] Verify today's bookings display
- [ ] Test date navigation (previous/next day)
- [ ] Check timeline view shows correct slots
- [ ] Test list view sorting
- [ ] Verify booking details modal opens

#### CP2.6: Host Manages Availability
- [ ] Navigate to "Disponibilidad" tab
- [ ] Select clinic from dropdown
- [ ] Select date range
- [ ] Add unavailability period
- [ ] Verify slots blocked in calendar
- [ ] Delete unavailability
- [ ] Confirm slots available again

#### CP2.7: Host Check-In/Check-Out
- [ ] Navigate to "Presencia" tab
- [ ] Select clinic
- [ ] Click "Check In"
- [ ] Verify check-in time recorded
- [ ] Add optional notes
- [ ] Click "Check Out"
- [ ] Verify duration calculated
- [ ] Check history log updated

---

### 🔴 CRITICAL PATH 3: Admin Booking Confirmation (Cardnet)
**Dependencies:** Pending booking exists  
**Priority:** HIGH

#### CP3.1: View Pending Bookings
- [ ] Admin navigates to /admin/booking-confirmation
- [ ] Verify pending bookings list loads
- [ ] Check expiration countdown displays
- [ ] Verify booking details accessible

#### CP3.2: Confirm Payment
- [ ] Select pending booking
- [ ] Click "Confirmar Pago"
- [ ] Verify confirmation dialog shows
- [ ] Confirm payment
- [ ] Check booking status → 'confirmed'
- [ ] Verify transaction updated:
  - [ ] Status → 'succeeded'
  - [ ] Platform fee calculated
  - [ ] Host payout calculated
  - [ ] Transaction ID generated
- [ ] Confirm invoice generated
- [ ] Verify notifications sent (dentist + host)

#### CP3.3: Cancel Expired Booking
- [ ] Wait for booking to expire (or manually set expires_at)
- [ ] Run automatic expiration check
- [ ] Verify booking status → 'cancelled'
- [ ] Check transaction status → 'cancelled'
- [ ] Confirm expiration notification sent

---

## Module-by-Module Testing

### 1. Authentication & Authorization Module

#### 1.1 User Registration (`src/pages/Register.jsx`)
**Dependencies:** Supabase Auth, profiles table  
**RPC Functions:** `handle_new_user` trigger

- [ ] **Valid Registration:**
  - [ ] Email format validation
  - [ ] Password strength requirement (≥6 chars)
  - [ ] Password confirmation match
  - [ ] Full name required
  - [ ] Phone required (for dentist)
  - [ ] Role selection (dentist/clinic_host)
  - [ ] Terms acceptance checkbox
- [ ] **Database Verification:**
  - [ ] User created in auth.users
  - [ ] Profile created in public.profiles
  - [ ] Role assigned correctly
  - [ ] Metadata saved (raw_user_meta_data)
- [ ] **Error Handling:**
  - [ ] Duplicate email rejected
  - [ ] Network error handling
  - [ ] Missing required fields blocked
  - [ ] Invalid email format rejected

#### 1.2 User Login (`src/pages/Login.jsx`)
**Dependencies:** SupabaseAuthContext

- [ ] **Successful Login:**
  - [ ] Valid email + password
  - [ ] Session created
  - [ ] Redirect to /home
  - [ ] User profile loaded
- [ ] **Failed Login:**
  - [ ] Invalid credentials error displayed
  - [ ] Account not found message
  - [ ] Network error handling
- [ ] **Session Persistence:**
  - [ ] Session survives page refresh
  - [ ] localStorage backup created
  - [ ] Cross-tab logout detected
  - [ ] Session expiry handled

#### 1.3 Password Reset (`src/pages/ForgotPassword.jsx`, `src/pages/UpdatePassword.jsx`)
- [ ] **Request Reset:**
  - [ ] Enter valid email
  - [ ] Verification email sent
  - [ ] Reset link contains valid token
- [ ] **Update Password:**
  - [ ] Click reset link
  - [ ] Navigate to /update-password
  - [ ] Enter new password
  - [ ] Confirm password match
  - [ ] Submit successfully
  - [ ] Redirect to login
  - [ ] Old password invalidated

#### 1.4 Logout (`src/contexts/SupabaseAuthContext.jsx`)
- [ ] **Standard Logout:**
  - [ ] Click "Cerrar Sesión"
  - [ ] Session cleared from Supabase
  - [ ] Local storage cleared
  - [ ] User state reset
  - [ ] Redirect to homepage
- [ ] **Cross-Tab Logout:**
  - [ ] Logout in Tab A
  - [ ] Tab B detects logout
  - [ ] Tab B clears user state
- [ ] **Session Expiry:**
  - [ ] Expired session detected
  - [ ] User logged out automatically
  - [ ] Graceful error handling (403)

#### 1.5 Protected Routes (`src/components/auth/ProtectedRoute.jsx`)
- [ ] **Access Control:**
  - [ ] Unauthenticated redirect to /login
  - [ ] Unauthorized role redirect to home
  - [ ] Dentist-only routes protected
  - [ ] Host-only routes protected
  - [ ] Admin-only routes protected
  - [ ] Support-only routes protected
- [ ] **Session Validation:**
  - [ ] Valid session allows access
  - [ ] Expired session blocks access
  - [ ] 403 errors trigger logout
  - [ ] Loading state displays during validation

#### 1.6 Role-Based Access Control
**Roles:** dentist, clinic_host, admin, support, accountant

- [ ] **Dentist Access:**
  - [ ] /search-clinics ✅
  - [ ] /book-clinic/:id ✅
  - [ ] /my-bookings ✅
  - [ ] /profile ✅
  - [ ] /clinic-dashboard ❌
  - [ ] /admin-dashboard ❌
- [ ] **Clinic Host Access:**
  - [ ] /clinic-dashboard ✅
  - [ ] /clinic-dashboard/edit/:id ✅
  - [ ] /search-clinics ✅
  - [ ] /admin-dashboard ❌
- [ ] **Admin Access:**
  - [ ] All routes ✅
  - [ ] /admin-dashboard ✅
  - [ ] /admin/* ✅
- [ ] **Support Access:**
  - [ ] /support-dashboard ✅
  - [ ] /admin/chat-management ✅
  - [ ] Limited admin features

---

### 2. User Profile Module

#### 2.1 Profile Viewing (`src/pages/ProfilePage.jsx`)
**Dependencies:** UserContext, profiles table

- [ ] **Load Profile Data:**
  - [ ] Full name displayed
  - [ ] Email displayed
  - [ ] Phone displayed
  - [ ] Role displayed
  - [ ] Avatar displayed (or initials fallback)
- [ ] **Role-Specific Info:**
  - [ ] **Dentist:** ID document, university, specialty
  - [ ] **Host:** RNC, legal name, bank account
- [ ] **Tabs Navigation:**
  - [ ] Info Personal tab
  - [ ] Info Profesional tab (dentist only)
  - [ ] Info Anfitrión tab (host only)
  - [ ] Documentos tab (dentist only)
  - [ ] Reservas tab (dentist only)

#### 2.2 Profile Editing (`src/components/auth/EditProfileDialog.jsx`)
- [ ] **Edit Personal Info:**
  - [ ] Update full name
  - [ ] Update phone
  - [ ] Changes saved to database
  - [ ] UserContext refreshed
  - [ ] Success toast displayed
- [ ] **Edit Dentist Info:**
  - [ ] Update ID document number
  - [ ] Update university
  - [ ] Update specialty
  - [ ] Update birth date
  - [ ] Update address
- [ ] **Edit Host Info:**
  - [ ] Update RNC
  - [ ] Update legal name
- [ ] **Validation:**
  - [ ] Required fields enforced
  - [ ] Phone format validation
  - [ ] Date format validation

#### 2.3 Avatar Upload
- [ ] **Upload Process:**
  - [ ] Click avatar to open file picker
  - [ ] Select image file (jpg/png/gif)
  - [ ] Verify upload progress indicator
  - [ ] Image uploaded to 'avatars' bucket
  - [ ] File path format: `{user_id}/avatar-{timestamp}`
  - [ ] Public URL generated
  - [ ] Profile updated with new avatar_url
- [ ] **Avatar Display:**
  - [ ] New avatar loads immediately
  - [ ] Cache-busting timestamp added
  - [ ] Fallback to initials if upload fails
- [ ] **Error Handling:**
  - [ ] File size limit enforced (if configured)
  - [ ] Invalid file type rejected
  - [ ] Storage error displayed

#### 2.4 Document Management (Dentist Only)
**Component:** `src/components/auth/DentistDocuments.jsx`

- [ ] **Upload Documents:**
  - [ ] Professional title document
  - [ ] Exequatur document
  - [ ] ID document
  - [ ] Dental college certificate
  - [ ] Liability insurance
- [ ] **Validation:**
  - [ ] PDF files accepted
  - [ ] File size limit checked
  - [ ] Document type validated
- [ ] **Status Tracking:**
  - [ ] Pending review status
  - [ ] Approved status
  - [ ] Rejected status (with reason)
- [ ] **Admin Review:**
  - [ ] Admin views documents
  - [ ] Approve/reject action
  - [ ] Rejection reason required

#### 2.5 Bank Account Management (Host Only)
**Hook:** `src/hooks/useHostBankAccount.js`

- [ ] **Add Bank Account:**
  - [ ] Open bank account modal
  - [ ] Fill bank details:
    - [ ] Bank name
    - [ ] Account holder name
    - [ ] Account number
    - [ ] Account type (savings/checking)
    - [ ] Document type (cedula/passport)
    - [ ] Document number
  - [ ] Submit form
  - [ ] Verify saved to `host_payout_accounts`
  - [ ] Audit log created
- [ ] **Edit Bank Account:**
  - [ ] Click edit button
  - [ ] Modify fields
  - [ ] Save changes
  - [ ] Audit log updated
- [ ] **Delete Bank Account:**
  - [ ] Click delete button
  - [ ] Confirmation dialog
  - [ ] Account deleted
  - [ ] Audit log created
- [ ] **Validation:**
  - [ ] Account number format
  - [ ] Required fields enforced
  - [ ] Dominican banks validated

---

### 3. Clinic Management Module

#### 3.1 Clinic Creation (Multi-Step)
**Flow:** `src/pages/PublishClinicIntro.jsx` → Steps 1-4

- [ ] **Step 1 - Basic Information:**
  - [ ] Name validation (required, min length)
  - [ ] Type selection (dropdown)
  - [ ] Description rich text editor:
    - [ ] Formatting toolbar works
    - [ ] Character count displays
    - [ ] HTML sanitization applied
  - [ ] Display name / Real name toggle
  - [ ] Number of cubicles (≥1)
- [ ] **Step 2 - Location:**
  - [ ] Address autocomplete works
  - [ ] Province, municipality, sector populated
  - [ ] Map picker displays
  - [ ] Coordinates saved (latitude/longitude)
  - [ ] Address string formatted correctly
- [ ] **Step 3 - Pricing & Services:**
  - [ ] Price per hour (numeric validation)
  - [ ] Minimum booking hours (≥1, default 4)
  - [ ] Services checklist loads
  - [ ] Selected services saved
- [ ] **Step 4 - Policies & Review:**
  - [ ] Policies rich text editor
  - [ ] Rules checklist (allowed/not allowed)
  - [ ] Review summary displays all data
  - [ ] Submit creates clinic with status 'pending'
- [ ] **Navigation:**
  - [ ] Next/Previous buttons work
  - [ ] Progress indicator updates
  - [ ] Data persists between steps
  - [ ] Exit warning if unsaved changes

#### 3.2 Clinic Photo Management
**Hook:** `src/hooks/useClinicPhotos.js`  
**Component:** `src/components/clinic-dashboard/ClinicPhotosManager.jsx`

- [ ] **Upload Photos:**
  - [ ] Select multiple files (up to 20 total)
  - [ ] File validation (jpg/png/webp, max size)
  - [ ] Upload progress displayed
  - [ ] Images optimized before upload
  - [ ] Photos saved to 'clinic_photos' bucket
  - [ ] Database records created
  - [ ] Display order assigned
- [ ] **Set Cover Photo:**
  - [ ] Click "Set as Cover" button
  - [ ] is_cover flag updated
  - [ ] Previous cover unmarked
  - [ ] Cover displays first in carousel
- [ ] **Reorder Photos:**
  - [ ] Drag and drop functionality
  - [ ] Display order updated in database
  - [ ] Order persists on refresh
- [ ] **Delete Photos:**
  - [ ] Click delete button
  - [ ] Confirmation dialog
  - [ ] Photo removed from storage
  - [ ] Database record deleted
  - [ ] Remaining photos reordered
- [ ] **Photo Display:**
  - [ ] Carousel navigation works
  - [ ] Thumbnails clickable
  - [ ] Lightbox/full-screen view
  - [ ] Lazy loading applied
  - [ ] Optimized image URLs generated

#### 3.3 Clinic Editing
**Page:** `src/pages/clinic/EditClinicPage.jsx`

- [ ] **Load Existing Data:**
  - [ ] All clinic fields populated
  - [ ] Photos loaded
  - [ ] Services pre-selected
  - [ ] Policies displayed
- [ ] **Update Fields:**
  - [ ] Name change saves
  - [ ] Description change saves
  - [ ] Price update validates
  - [ ] Services update saves
  - [ ] Photos can be added/removed
  - [ ] Location can be changed
- [ ] **Validation:**
  - [ ] Required fields enforced
  - [ ] Price > 0
  - [ ] Min hours ≥ 1
  - [ ] Coordinates valid
- [ ] **Save Changes:**
  - [ ] Changes persist to database
  - [ ] Success toast displayed
  - [ ] Redirect to clinic dashboard

#### 3.4 Clinic Services Management
**Hook:** `src/hooks/useClinicServices.js`

- [ ] **Load Master Services:**
  - [ ] Dental services list fetches
  - [ ] Amenities list fetches
  - [ ] Categories separate correctly
- [ ] **Assign Services to Clinic:**
  - [ ] Select service from list
  - [ ] Service added to `clinic_services`
  - [ ] Service displays on clinic page
  - [ ] Icon/name correct
- [ ] **Remove Services:**
  - [ ] Deselect service
  - [ ] Service removed from clinic
  - [ ] Database record deleted
- [ ] **Service Display:**
  - [ ] Services grouped by category
  - [ ] Icons display correctly
  - [ ] Responsive grid layout

#### 3.5 Clinic Availability Management
**Component:** `src/components/clinic-dashboard/AvailabilityManager.jsx`

- [ ] **View Availability:**
  - [ ] Calendar displays month view
  - [ ] Unavailable dates marked
  - [ ] Tooltip shows reason
- [ ] **Add Unavailability:**
  - [ ] Select date range
  - [ ] Enter reason (optional)
  - [ ] Submit creates `clinic_unavailability` record
  - [ ] Calendar updates
- [ ] **Remove Unavailability:**
  - [ ] Click delete button
  - [ ] Confirmation dialog
  - [ ] Record deleted
  - [ ] Calendar updates
- [ ] **Validation:**
  - [ ] Start date < end date
  - [ ] No overlapping periods
  - [ ] Past dates cannot be blocked

#### 3.6 Admin Clinic Validation
**Page:** `src/pages/admin/ClinicValidationPage.jsx`

- [ ] **View Pending Clinics:**
  - [ ] List loads all status='pending'
  - [ ] Clinic details accessible
  - [ ] Photos viewable
  - [ ] Location map displayed
- [ ] **Approve Clinic:**
  - [ ] Click approve button
  - [ ] Status changed to 'published'
  - [ ] Clinic appears in search
  - [ ] Host notification sent
- [ ] **Reject Clinic:**
  - [ ] Enter rejection reason
  - [ ] Status changed to 'rejected'
  - [ ] Host notification sent
  - [ ] Clinic not searchable

---

### 4. Search & Discovery Module

#### 4.1 Clinic Search (`src/pages/SearchClinics.jsx`)
**Hook:** `src/hooks/useCachedClinics.js`

- [ ] **Load Clinics:**
  - [ ] All published clinics fetch
  - [ ] Photos loaded (cover photo prioritized)
  - [ ] Ratings calculated
  - [ ] Booking counts loaded
  - [ ] Featured clinics sorted first
- [ ] **Search by Name/Description:**
  - [ ] Text input debounced
  - [ ] Partial match works
  - [ ] Case-insensitive
  - [ ] Results update in real-time
- [ ] **Filter by Location:**
  - [ ] Province dropdown populates
  - [ ] Municipio depends on province
  - [ ] Sector depends on municipio
  - [ ] Cascading filters work
  - [ ] "All" options available
- [ ] **Sort by Price:**
  - [ ] Ascending sort works
  - [ ] Descending sort works
  - [ ] Default/relevance sort
- [ ] **Filter by Availability:**
  - [ ] Date picker opens
  - [ ] Select date
  - [ ] Clinics with bookings on that date hidden
  - [ ] Available clinics displayed
- [ ] **Clear Filters:**
  - [ ] All filters reset
  - [ ] Search term cleared
  - [ ] Full clinic list restored
  - [ ] Toast notification shown

#### 4.2 Clinic List Display
**Component:** `src/components/search/ClinicList.jsx`

- [ ] **Grid Layout:**
  - [ ] Responsive columns (1 → 2 → 3 → 4)
  - [ ] Cards uniform height
  - [ ] Images load correctly
  - [ ] Hover effects work
- [ ] **Clinic Card (`ClinicCard.jsx`):**
  - [ ] Cover photo displays
  - [ ] Clinic name visible
  - [ ] Location (sector, municipality)
  - [ ] Price per hour
  - [ ] Number of cubicles
  - [ ] Featured badge (if applicable)
  - [ ] Rating stars
  - [ ] Favorite button accessible
- [ ] **Pagination:**
  - [ ] Initial 12 clinics load
  - [ ] "Cargar más" button appears
  - [ ] Loads next 12 on click
  - [ ] Button hides when all loaded
- [ ] **Empty State:**
  - [ ] No results message displays
  - [ ] "Clear filters" link works
  - [ ] Icon displayed

#### 4.3 Map View
**Component:** `src/components/ui/ClinicMap.jsx`

- [ ] **Map Loading:**
  - [ ] OpenStreetMap tiles load
  - [ ] Markers placed correctly
  - [ ] Approximate locations (for non-bookers)
  - [ ] Exact locations (for users with confirmed bookings)
- [ ] **Marker Interaction:**
  - [ ] Click marker opens popup
  - [ ] Popup shows clinic name, price
  - [ ] "Ver Detalles" button works
  - [ ] Popup closes correctly
- [ ] **Map Controls:**
  - [ ] Zoom in/out works
  - [ ] Pan/drag works
  - [ ] Bounds fit all markers
  - [ ] Touch gestures work (mobile)
- [ ] **Performance:**
  - [ ] Clustering for many markers (if implemented)
  - [ ] Lazy loading tiles
  - [ ] No memory leaks on unmount

#### 4.4 Favorites System
**Hook:** `src/hooks/useFavoriteClinic.js`

- [ ] **Add to Favorites:**
  - [ ] Click heart icon
  - [ ] Record created in `favorite_clinics`
  - [ ] Icon fills with color
  - [ ] Favorite count increments
  - [ ] Toast notification shown
- [ ] **Remove from Favorites:**
  - [ ] Click filled heart icon
  - [ ] Record deleted
  - [ ] Icon returns to outline
  - [ ] Favorite count decrements
- [ ] **Favorite Count:**
  - [ ] Badge displays correct count
  - [ ] Updates across tabs/components
  - [ ] Syncs via event bus
- [ ] **Login Prompt:**
  - [ ] Unauthenticated click shows modal
  - [ ] Modal has login/register links
  - [ ] After login, favorite action completes
- [ ] **Favorites Page (`/favorite-clinics`):**
  - [ ] Load user's favorites
  - [ ] Display as grid
  - [ ] Click clinic navigates to details
  - [ ] Remove favorite from this page
  - [ ] Empty state if no favorites

---

### 5. Booking & Scheduling Module

#### 5.1 Clinic Booking Page (`src/pages/ClinicBookingPage.jsx`)

- [ ] **Load Clinic Details:**
  - [ ] Clinic name, description
  - [ ] Address, location map
  - [ ] Price per hour
  - [ ] Min booking hours
  - [ ] Photo carousel
  - [ ] Services list
  - [ ] Reviews section
  - [ ] Host info card
- [ ] **Calendar Selection:**
  - [ ] Calendar widget opens
  - [ ] Today and future dates selectable
  - [ ] Past dates disabled
  - [ ] Booked dates marked
  - [ ] Fully booked dates have indicator
  - [ ] Selected date highlighted
- [ ] **Time Slot Selection:**
  - [ ] Available slots fetch on date selection
  - [ ] Slots display 7 AM - 9 PM
  - [ ] Unavailable slots grayed out
  - [ ] Conflicting bookings block slots
  - [ ] Host unavailability blocks slots
  - [ ] Current time blocks past slots (if today)
- [ ] **Time Range Selector:**
  - [ ] Start time dropdown populates
  - [ ] End time dropdown populates
  - [ ] End time must be > start time
  - [ ] Duration calculated (hours)
  - [ ] Min hours validation enforced
  - [ ] Total price calculated
  - [ ] Error messages display

#### 5.2 Booking Validation
- [ ] **Profile Completeness:**
  - [ ] Check full_name exists
  - [ ] Check dentist_id_document_number exists
  - [ ] Redirect to /profile if incomplete
  - [ ] Toast message displayed
- [ ] **Time Validation:**
  - [ ] Start < end enforced
  - [ ] Duration ≥ min_hours_booking
  - [ ] Slot availability verified
  - [ ] Overlap prevention
- [ ] **Payment Readiness:**
  - [ ] All fields filled
  - [ ] No validation errors
  - [ ] "Continuar al pago" enabled

#### 5.3 Booking Agreement Dialog
**Component:** `src/components/booking/BookingAgreementDialog.jsx`

- [ ] **Dialog Opens:**
  - [ ] User info displayed
  - [ ] Clinic info displayed
  - [ ] Booking details correct
  - [ ] Terms section visible
  - [ ] Scrollable content
- [ ] **Payment Form Loads:**
  - [ ] Payment method tabs visible
  - [ ] Cardnet tab (default)
  - [ ] PayPal tab
  - [ ] Error boundary active

#### 5.4 Payment Processing - Cardnet
**Function:** `src/lib/payments/cardnet.js`

- [ ] **Create Pending Booking:**
  - [ ] RPC `create_pending_booking_and_transaction` called
  - [ ] Booking created with status 'pending'
  - [ ] Transaction created with status 'pending'
  - [ ] expires_at set to 75 minutes from now
  - [ ] Booking ID returned
- [ ] **WhatsApp Redirect:**
  - [ ] WhatsApp message generated
  - [ ] Message includes booking ID, clinic, date, price
  - [ ] Redirect to WhatsApp occurs
  - [ ] Toast notification shown
- [ ] **Admin Notification:**
  - [ ] Notification created for admin/accountant roles
  - [ ] Message includes clinic name, amount
  - [ ] Link to /admin/booking-confirmation

#### 5.5 Payment Processing - PayPal
**Function:** `src/lib/payments/paypal.js`  
**Context:** `src/contexts/PayPalContext.jsx`

- [ ] **PayPal SDK Loads:**
  - [ ] Client ID fetched from edge function
  - [ ] SDK script injected
  - [ ] Buttons render in modal
- [ ] **Create Order:**
  - [ ] PayPal order created
  - [ ] Amount in DOP converted to USD
  - [ ] Order ID returned
- [ ] **Approve Order:**
  - [ ] User completes payment in PayPal modal
  - [ ] Order captured
  - [ ] Payment details retrieved
- [ ] **Create Confirmed Booking:**
  - [ ] RPC `create_paypal_booking` called
  - [ ] Booking created with status 'confirmed'
  - [ ] Transaction created with status 'succeeded'
  - [ ] Platform fee calculated (25%)
  - [ ] Host payout calculated
  - [ ] Invoice generated
- [ ] **Email Confirmation:**
  - [ ] Confirmation email sent to dentist
  - [ ] Email includes booking details, invoice link
  - [ ] Host notification email sent
- [ ] **Redirect:**
  - [ ] Navigate to /my-bookings
  - [ ] Success toast displayed

#### 5.6 Booking Cancellation (Dentist)
**Function:** `dentist_cancel_booking` RPC

- [ ] **Cancel Pending Booking:**
  - [ ] Click cancel button
  - [ ] Confirmation dialog
  - [ ] Booking status → 'cancelled'
  - [ ] Transaction status → 'cancelled'
  - [ ] No penalty, instant refund
- [ ] **Cancel Confirmed Booking (>24h):**
  - [ ] Click cancel button
  - [ ] Confirmation dialog with policy warning
  - [ ] Booking status → 'cancelled'
  - [ ] Transaction payout_status → 'refund_requested'
  - [ ] Refund eligible (100%)
  - [ ] Refund processed in 5-10 business days
  - [ ] Confirmation email sent
- [ ] **Cancel Confirmed Booking (<24h):**
  - [ ] Click cancel button
  - [ ] Warning: No refund policy
  - [ ] Booking status → 'cancelled'
  - [ ] No refund issued
  - [ ] Host receives full payment
  - [ ] Confirmation email sent
- [ ] **Notifications:**
  - [ ] Host notified of cancellation
  - [ ] Dentist receives cancellation confirmation
  - [ ] Refund status communicated

#### 5.7 Booking Cancellation (Host)
**Function:** `host_cancel_booking` RPC

- [ ] **Cancel Confirmed Booking:**
  - [ ] Host clicks cancel
  - [ ] Confirmation required
  - [ ] Booking status → 'cancelled_by_host'
  - [ ] Transaction payout_status → 'refund_requested'
  - [ ] Dentist receives full refund
  - [ ] Host notification sent
  - [ ] Dentist notification sent

#### 5.8 Automatic Expiration Handling
**Function:** `handle_expired_bookings` RPC (scheduled job)

- [ ] **Expiration Check:**
  - [ ] Function runs periodically (e.g., every 5 minutes)
  - [ ] Selects bookings where expires_at < NOW()
  - [ ] Status = 'pending'
- [ ] **Expire Booking:**
  - [ ] Booking status → 'cancelled'
  - [ ] Transaction status → 'cancelled'
  - [ ] Notification sent to dentist
- [ ] **Cleanup:**
  - [ ] Returns count of expired bookings
  - [ ] Logs action

---

### 6. Reviews & Ratings Module

#### 6.1 View Reviews
**Component:** `src/components/reviews/ReviewCard.jsx`

- [ ] **Load Clinic Reviews:**
  - [ ] Fetch reviews for clinic
  - [ ] Display in descending order (newest first)
  - [ ] Show reviewer name, avatar
  - [ ] Display rating (stars)
  - [ ] Show comment text
  - [ ] Show creation date (relative time)
- [ ] **Review Stats:**
  - [ ] Average rating calculated
  - [ ] Total review count displayed
  - [ ] Breakdown by rating (5-star, 4-star, etc.) if implemented
- [ ] **Empty State:**
  - [ ] Message if no reviews
  - [ ] Prompt to leave first review

#### 6.2 Submit Review
**Component:** `src/components/reviews/ReviewModal.jsx`

- [ ] **Eligibility Check:**
  - [ ] User must be logged in
  - [ ] User must have past confirmed booking
  - [ ] User must not have already reviewed
  - [ ] "Escribir Reseña" button visible only if eligible
- [ ] **Review Form:**
  - [ ] Overall rating (1-5 stars)
  - [ ] Cleanliness rating (1-5)
  - [ ] Exactitude rating (1-5)
  - [ ] Location rating (1-5)
  - [ ] Price rating (1-5)
  - [ ] General experience rating (1-5)
  - [ ] Comment text area
- [ ] **Validation:**
  - [ ] Overall rating required
  - [ ] All category ratings required
  - [ ] Comment optional but recommended
- [ ] **Submit:**
  - [ ] Data inserted into `clinic_reviews`
  - [ ] Average rating recalculated
  - [ ] Modal closes
  - [ ] Review appears in list
  - [ ] Success toast displayed
- [ ] **Error Handling:**
  - [ ] Duplicate review blocked (DB constraint)
  - [ ] Network error handling
  - [ ] Validation errors displayed

---

### 7. Chat & Communication Module

#### 7.1 Booking Chat
**Component:** `src/components/chat/BookingChatWindow.jsx`  
**Context:** `src/contexts/BookingChatContext.jsx`

- [ ] **Chat Availability:**
  - [ ] Chat enabled for confirmed bookings
  - [ ] Chat disabled for pending/cancelled bookings
  - [ ] Chat accessible to dentist
  - [ ] Chat accessible to host
- [ ] **Open Chat:**
  - [ ] Click chat button
  - [ ] Chat window opens
  - [ ] Messages load (latest 50)
  - [ ] Scroll to bottom
- [ ] **Send Message:**
  - [ ] Type message in input
  - [ ] Send button enabled when text entered
  - [ ] Press Enter to send (Shift+Enter for new line)
  - [ ] Message inserted into `booking_chat_messages`
  - [ ] Message appears in chat
  - [ ] Input cleared
- [ ] **Receive Message:**
  - [ ] Realtime subscription active
  - [ ] New message appears instantly
  - [ ] Scroll to new message
  - [ ] Notification sound (optional)
- [ ] **Typing Indicator:**
  - [ ] Start typing → indicator sent
  - [ ] Other user sees "Escribiendo..."
  - [ ] Indicator clears after 3 seconds
- [ ] **Read Receipts:**
  - [ ] Message read when viewed
  - [ ] "Visto" checkmark appears
  - [ ] Read count updated
- [ ] **Attachments:**
  - [ ] Click attachment button
  - [ ] Select file (image/document)
  - [ ] File uploaded to 'booking_chat_attachments'
  - [ ] Thumbnail/link displayed in chat
  - [ ] Click attachment to view/download
- [ ] **Location Sharing:**
  - [ ] Click location button
  - [ ] Clinic location sent as message
  - [ ] Map preview displayed in chat
- [ ] **Chat Time Window:**
  - [ ] Chat accessible 24h before booking start
  - [ ] Chat remains accessible until booking end
  - [ ] Warning displayed if outside window
  - [ ] Message sending blocked if outside window

#### 7.2 Support Chat
**Component:** `src/components/support/SupportChatWidget.jsx`  
**Context:** `src/contexts/SupportChatContext.jsx`

- [ ] **Open Ticket:**
  - [ ] Click "Soporte" in menu
  - [ ] Navigate to /support
  - [ ] Create new conversation
  - [ ] Select category
  - [ ] Enter subject, message
  - [ ] Submit creates `support_conversations` record
- [ ] **Chat Interface:**
  - [ ] Messages load in chronological order
  - [ ] User messages right-aligned
  - [ ] Support messages left-aligned
  - [ ] Timestamps displayed
- [ ] **Send Message:**
  - [ ] Type message
  - [ ] Attach file (optional)
  - [ ] Send inserts `support_messages` record
  - [ ] Conversation status → 'open'
  - [ ] Support team notified
- [ ] **Support Agent Response:**
  - [ ] Agent views conversation in /support-dashboard
  - [ ] Agent sends reply
  - [ ] User receives notification
  - [ ] Message appears in chat
- [ ] **Close Ticket:**
  - [ ] Agent marks conversation as 'closed'
  - [ ] closed_at timestamp set
  - [ ] User notified
  - [ ] Conversation archived after 48h
- [ ] **Reopen Ticket:**
  - [ ] User sends message on closed ticket
  - [ ] Status → 'open'
  - [ ] Support notified

---

### 8. Financial Management Module

#### 8.1 Host Financials Dashboard
**Component:** `src/components/clinic-dashboard/Financials.jsx`  
**RPC:** `get_host_financial_summary`

- [ ] **View Financial Summary:**
  - [ ] Pending balance calculated
  - [ ] Total revenue (all-time) displayed
  - [ ] Last payout amount shown
  - [ ] Last payout date shown
  - [ ] Transaction history table
- [ ] **Transaction History:**
  - [ ] Transactions listed in descending order
  - [ ] Columns: Date, Clinic, Dentist, Amount, Fee, Payout, Status
  - [ ] Payout status: pending/requested/processing/paid
  - [ ] Filter by status (if implemented)
  - [ ] Pagination (if many transactions)
- [ ] **Request Payout:**
  - [ ] "Solicitar Pago" button enabled if balance > 0
  - [ ] Click button
  - [ ] Confirmation dialog with amount
  - [ ] RPC `request_payout` called
  - [ ] Payout request created
  - [ ] Transactions status → 'requested'
  - [ ] Admin notification sent
  - [ ] Success toast displayed
  - [ ] Button disabled until payout processed

#### 8.2 Admin Financial Dashboard
**Page:** `src/pages/admin/FinancialDashboardPage.jsx`  
**RPC:** `get_host_balances`

- [ ] **View Host Balances:**
  - [ ] List all hosts with pending payouts
  - [ ] Columns: Host Name, RNC, Pending Transactions, Total Amount
  - [ ] Sorted by amount (descending)
- [ ] **Select Hosts for Payout:**
  - [ ] Checkbox for each host
  - [ ] Select all / deselect all
  - [ ] Verify bank account exists for selected hosts
- [ ] **Create Payout Batch:**
  - [ ] Click "Crear Lote de Pago"
  - [ ] RPC `create_payout_batch` called
  - [ ] Batch created with status 'processing'
  - [ ] Individual payouts created for each host
  - [ ] Transactions status → 'processing'
  - [ ] Navigate to batch details page
- [ ] **View Payout Batch:**
  - [ ] Batch ID, creation date, status
  - [ ] List of payouts in batch
  - [ ] Columns: Host, Account, Amount, Status
  - [ ] Export CSV (if implemented)
- [ ] **Mark Batch as Paid:**
  - [ ] Click "Marcar como Pagado"
  - [ ] Confirmation dialog
  - [ ] RPC `mark_payout_batch_as_paid` called
  - [ ] Batch status → 'completed'
  - [ ] Payout statuses → 'paid'
  - [ ] Transactions payout_status → 'paid'
  - [ ] Host notifications sent

#### 8.3 Invoice Generation
**Function:** `generate_invoice_for_booking` RPC  
**Component:** `src/pages/InvoicePage.jsx`

- [ ] **Auto-Generation:**
  - [ ] Invoice created on booking confirmation
  - [ ] Invoice number generated (INV-XXXXXX)
  - [ ] Issue date = current date
  - [ ] Due date = issue date (or configurable)
  - [ ] Subtotal calculated (total / 1.18)
  - [ ] Taxes calculated (18% ITBIS)
  - [ ] Total = booking total_price
  - [ ] Status = 'paid'
- [ ] **View Invoice:**
  - [ ] Navigate to /invoice/:bookingId
  - [ ] Invoice details displayed:
    - [ ] Invoice number
    - [ ] Dentist info (name, ID)
    - [ ] Clinic info (name, host)
    - [ ] Booking details (date, time, duration)
    - [ ] Itemized charges
    - [ ] Subtotal, taxes, total
  - [ ] Download PDF button
- [ ] **PDF Generation:**
  - [ ] Click "Descargar PDF"
  - [ ] PDF rendered via @react-pdf/renderer
  - [ ] Formatted invoice layout
  - [ ] Logo, branding (if configured)
  - [ ] File downloads as `Factura-INV-XXXXXX.pdf`

---

### 9. Admin Tools & Management

#### 9.1 User Management
**Page:** `src/pages/admin/UserManagementPage.jsx`

- [ ] **View All Users:**
  - [ ] DataTable loads all profiles
  - [ ] Columns: Name, Email, Role, Status, Actions
  - [ ] Search by name/email
  - [ ] Filter by role
  - [ ] Pagination controls
- [ ] **Edit User:**
  - [ ] Click edit icon
  - [ ] Dialog opens with user data
  - [ ] Update fields (name, phone, role)
  - [ ] Save changes
  - [ ] User updated in database
  - [ ] Success toast
- [ ] **Delete User:**
  - [ ] Click delete icon
  - [ ] Confirmation dialog (destructive action)
  - [ ] User deleted from auth.users and profiles
  - [ ] Associated data handled (bookings, clinics, etc.)
  - [ ] Success toast
- [ ] **Create User:**
  - [ ] Click "Crear Usuario"
  - [ ] Dialog opens
  - [ ] Fill form (email, password, name, role)
  - [ ] Submit creates user
  - [ ] Email confirmation sent
  - [ ] User appears in table

#### 9.2 Clinic Management
**Page:** `src/pages/admin/ClinicManagementPage.jsx`

- [ ] **View All Clinics:**
  - [ ] Load all clinics (any status)
  - [ ] Filter by status (pending/published/rejected)
  - [ ] Search by name
  - [ ] View details
- [ ] **Edit Clinic:**
  - [ ] Admin can modify any field
  - [ ] Update pricing
  - [ ] Change status manually
  - [ ] Update availability
- [ ] **Delete Clinic:**
  - [ ] Confirmation required
  - [ ] Clinic and associated data deleted
  - [ ] Photos removed from storage
  - [ ] Bookings handled (if any)

#### 9.3 Document Validation
**Page:** `src/pages/admin/UserDocumentsPage.jsx`

- [ ] **View Documents:**
  - [ ] Load user's uploaded documents
  - [ ] Display document type, upload date, status
  - [ ] Preview/download link
- [ ] **Approve Document:**
  - [ ] Click approve button
  - [ ] Document status → 'approved'
  - [ ] User's documentation_status updated
  - [ ] User notified
- [ ] **Reject Document:**
  - [ ] Enter rejection reason
  - [ ] Document status → 'rejected'
  - [ ] User notified with reason
  - [ ] User can re-upload

#### 9.4 Booking Confirmation (Cardnet)
**Page:** `src/pages/admin/BookingConfirmationPage.jsx`

- [ ] **View Pending Bookings:**
  - [ ] Load bookings with status='pending'
  - [ ] Filter by payment_gateway='Cardnet'
  - [ ] Display expiration countdown
  - [ ] Show booking details
- [ ] **Confirm Payment:**
  - [ ] Click "Confirmar Pago"
  - [ ] RPC `confirm_cardnet_payment` called
  - [ ] Verify booking not expired
  - [ ] Booking status → 'confirmed'
  - [ ] Transaction status → 'succeeded'
  - [ ] Platform fee calculated
  - [ ] Invoice generated
  - [ ] Notifications sent (dentist + host)
- [ ] **Cancel Booking:**
  - [ ] Click "Cancelar Reserva"
  - [ ] RPC `cancel_pending_booking` called
  - [ ] Booking status → 'cancelled'
  - [ ] Transaction status → 'cancelled'
  - [ ] Dentist notified

#### 9.5 System Configuration
**Component:** `src/components/admin/AdminSystemSettings.jsx`

- [ ] **Maintenance Mode:**
  - [ ] Toggle maintenance switch
  - [ ] Update `system_config` table
  - [ ] Non-admin users blocked
  - [ ] Maintenance page displays
  - [ ] Toggle off restores access
- [ ] **Email Configuration:**
  - [ ] View SMTP settings (masked)
  - [ ] Update SMTP host, port, credentials
  - [ ] Test email send
  - [ ] Success/failure notification
- [ ] **Policies Management:**
  - [ ] View all policy documents
  - [ ] Edit policy content (rich text)
  - [ ] Save changes
  - [ ] Public policies update immediately

#### 9.6 Audit Logs
**Component:** `src/components/admin/AuditLogViewer.jsx`

- [ ] **View Audit Trail:**
  - [ ] Load logs from `audit_logs` table
  - [ ] Filter by date range
  - [ ] Filter by admin user
  - [ ] Filter by action type
  - [ ] Search by resource ID
- [ ] **Log Details:**
  - [ ] Timestamp
  - [ ] Admin who performed action
  - [ ] Action type (create/update/delete/approve/reject)
  - [ ] Target resource (clinic/user/booking)
  - [ ] Details (JSON metadata)
  - [ ] IP address
- [ ] **Auto-Logging:**
  - [ ] Actions automatically logged
  - [ ] Cannot be deleted by admins
  - [ ] Immutable record

---

### 10. Notifications Module

#### 10.1 In-App Notifications
**Context:** `src/contexts/NotificationsContext.jsx`  
**Component:** `src/components/layout/NotificationsPanel.jsx`

- [ ] **Notification Creation:**
  - [ ] Triggered by system events:
    - [ ] Booking confirmed
    - [ ] Booking cancelled
    - [ ] Payment received
    - [ ] Document approved/rejected
    - [ ] Support ticket response
    - [ ] Payout processed
  - [ ] Record inserted into `notifications` table
  - [ ] User-specific (user_id)
- [ ] **Notification Display:**
  - [ ] Bell icon in navbar
  - [ ] Unread count badge
  - [ ] Click opens dropdown panel
  - [ ] Notifications listed (newest first)
  - [ ] Title, message, timestamp
  - [ ] Link to relevant page
- [ ] **Mark as Read:**
  - [ ] Click notification
  - [ ] is_read flag updated
  - [ ] Badge count decrements
  - [ ] Navigate to linked page
- [ ] **Real-Time Updates:**
  - [ ] Subscription to `notifications` table
  - [ ] New notification appears instantly
  - [ ] Count updates in real-time
- [ ] **Notification Types:**
  - [ ] booking_confirmation
  - [ ] booking_cancelled
  - [ ] new_booking (host)
  - [ ] payment_received
  - [ ] payout_processed
  - [ ] document_approved
  - [ ] document_rejected
  - [ ] support_response
  - [ ] pending_booking (admin)

#### 10.2 Email Notifications
**Service:** `src/lib/emailService.js`  
**Edge Function:** `send-email`

- [ ] **Welcome Email:**
  - [ ] Sent on registration
  - [ ] Personalized with user name
  - [ ] Contains verification link (if required)
- [ ] **Booking Confirmation Email:**
  - [ ] Sent to dentist on booking confirmation
  - [ ] Contains clinic name, date, time, amount
  - [ ] Invoice link included
  - [ ] Transaction ID
- [ ] **Host Notification Email:**
  - [ ] Sent to host on new booking
  - [ ] Contains dentist name, date, time
  - [ ] Expected payout amount
- [ ] **Payment Receipt Email:**
  - [ ] Sent after successful payment
  - [ ] Amount, concept, transaction ID
  - [ ] PDF invoice attached (if implemented)
- [ ] **Support Ticket Response:**
  - [ ] Sent when support replies
  - [ ] Contains message preview
  - [ ] Link to conversation
- [ ] **SMTP Configuration:**
  - [ ] SMTP credentials stored as Supabase secrets
  - [ ] Edge function accesses secrets
  - [ ] Emails sent via configured SMTP server
  - [ ] Delivery status logged in `email_logs`

---

### 11. Performance & Optimization

#### 11.1 Image Optimization
**Hook:** `src/hooks/useImageOptimization.js`  
**Library:** `browser-image-compression`

- [ ] **Upload Optimization:**
  - [ ] Images compressed before upload
  - [ ] Max size: 300KB
  - [ ] Max dimensions: 1200px
  - [ ] Format: WebP
  - [ ] Quality: 60%
- [ ] **Lazy Loading:**
  - [ ] `LazyImage` component used
  - [ ] IntersectionObserver triggers load
  - [ ] Placeholder/skeleton displayed
  - [ ] Smooth fade-in transition
- [ ] **Responsive Images:**
  - [ ] srcSet generated for multiple sizes
  - [ ] Sizes attribute set
  - [ ] Browser selects optimal image
- [ ] **Caching:**
  - [ ] Image cache strategy (localStorage/memory)
  - [ ] Cache expiration handled
  - [ ] Cache cleared on logout

#### 11.2 Data Caching
**Hook:** `src/hooks/useCachedClinics.js`  
**Service:** `src/lib/imageCache.js`

- [ ] **Clinic Data Caching:**
  - [ ] Clinics fetched once
  - [ ] Stored in memory cache
  - [ ] Expiration time set (e.g., 5 minutes)
  - [ ] Refresh on demand
- [ ] **Cache Invalidation:**
  - [ ] Cache cleared on logout
  - [ ] Cache refreshed on manual trigger
  - [ ] Stale data handling
- [ ] **Performance Metrics:**
  - [ ] Image load times tracked
  - [ ] Network speed detection
  - [ ] Metrics logged for admin review

#### 11.3 Code Splitting & Lazy Loading
**Implementation:** React.lazy(), Suspense

- [ ] **Route-Based Splitting:**
  - [ ] Pages lazy loaded
  - [ ] Chunks created per route
  - [ ] Loading fallback displayed
- [ ] **Component-Level Splitting:**
  - [ ] Large components lazy loaded
  - [ ] Error boundaries protect lazy components
- [ ] **Bundle Analysis:**
  - [ ] Bundle size verified (< reasonable limit)
  - [ ] No duplicate dependencies
  - [ ] Tree shaking applied

---

### 12. UI/UX Testing

#### 12.1 Responsive Design
- [ ] **Mobile (< 640px):**
  - [ ] All pages render correctly
  - [ ] Touch targets ≥ 44px
  - [ ] Text readable (≥ 16px)
  - [ ] No horizontal scroll
  - [ ] Forms usable
  - [ ] Modals/dialogs fit screen
- [ ] **Tablet (640px - 1024px):**
  - [ ] Grid layouts adjust
  - [ ] Sidebar collapsible
  - [ ] Images scale correctly
- [ ] **Desktop (> 1024px):**
  - [ ] Multi-column layouts work
  - [ ] Optimal use of screen space
  - [ ] Hover states visible

#### 12.2 Accessibility (A11y)
- [ ] **Keyboard Navigation:**
  - [ ] Tab order logical
  - [ ] Focus visible on all interactive elements
  - [ ] Skip links available
  - [ ] Modal traps focus
- [ ] **Screen Reader Support:**
  - [ ] Alt text on all images
  - [ ] ARIA labels on buttons/icons
  - [ ] Form labels associated
  - [ ] Error messages announced
- [ ] **Color Contrast:**
  - [ ] Text contrast ≥ 4.5:1 (normal text)
  - [ ] Text contrast ≥ 3:1 (large text)
  - [ ] Interactive elements distinguishable
- [ ] **Forms:**
  - [ ] Required fields indicated
  - [ ] Error messages clear
  - [ ] Success feedback provided

#### 12.3 Dark Mode (If Implemented)
- [ ] **Theme Toggle:**
  - [ ] Toggle switch accessible
  - [ ] Preference saved
  - [ ] Applied on page load
- [ ] **Dark Theme Consistency:**
  - [ ] All components styled for dark mode
  - [ ] Contrast maintained
  - [ ] Images/logos adjusted

#### 12.4 Animations & Transitions
- [ ] **Framer Motion:**
  - [ ] Animations smooth (no jank)
  - [ ] No layout shifts
  - [ ] Reduced motion preference respected
- [ ] **Loading States:**
  - [ ] Spinners/skeletons used appropriately
  - [ ] No blank screens
  - [ ] Optimistic UI updates

---

## Integration Testing

### Integration Test 1: Auth → Profile → Booking Flow
**Goal:** Verify seamless data flow from registration to booking confirmation

- [ ] User registers → Profile created → Email sent
- [ ] User logs in → Session established → Profile loaded
- [ ] User completes profile → Documents uploaded → Admin approves
- [ ] User searches clinics → Filters work → Clinic details load
- [ ] User books clinic → Payment processed → Booking confirmed
- [ ] User receives notifications → Email sent → Invoice generated

### Integration Test 2: Host → Clinic → Payout Flow
**Goal:** Verify host workflow from clinic creation to payout

- [ ] User becomes host → Request approved → Role changed
- [ ] Host creates clinic → Photos uploaded → Services assigned
- [ ] Host submits for approval → Admin approves → Clinic published
- [ ] Booking made → Payment confirmed → Transaction recorded
- [ ] Host requests payout → Admin processes → Bank transfer initiated
- [ ] Payout marked paid → Notifications sent → Balance updated

### Integration Test 3: Admin → System Management Flow
**Goal:** Verify admin tools work together

- [ ] Admin logs in → Dashboard loads → Stats display
- [ ] Admin validates clinic → Clinic published → Appears in search
- [ ] Admin confirms booking → Payment processed → Invoice generated
- [ ] Admin processes payout → Batch created → Hosts notified
- [ ] Admin updates system config → Maintenance mode → Users blocked
- [ ] Admin deactivates maintenance → Users restored → Audit logged

---

## End-to-End User Journeys

### E2E Journey 1: Complete Dentist Experience
**Persona:** Dr. María, new dentist user

1. [ ] Visit homepage as guest
2. [ ] Browse clinics without login
3. [ ] Click "Registrarse"
4. [ ] Fill registration form (dentist role)
5. [ ] Verify email (optional based on config)
6. [ ] Log in with credentials
7. [ ] Navigate to /profile
8. [ ] Complete profile (ID, university, specialty)
9. [ ] Upload professional documents
10. [ ] Wait for admin approval (simulate)
11. [ ] Navigate to /search-clinics
12. [ ] Search for clinic in Santo Domingo
13. [ ] Filter by price (ascending)
14. [ ] Add clinic to favorites
15. [ ] Click clinic to view details
16. [ ] Select booking date (tomorrow)
17. [ ] Choose time slot (9 AM - 1 PM)
18. [ ] Review booking summary
19. [ ] Click "Continuar al pago"
20. [ ] Choose PayPal payment
21. [ ] Complete payment in sandbox
22. [ ] Verify booking confirmed
23. [ ] Receive confirmation email
24. [ ] Navigate to /my-bookings
25. [ ] View confirmed booking
26. [ ] Open booking chat
27. [ ] Send message to host
28. [ ] Receive response (simulate)
29. [ ] Download invoice
30. [ ] After booking date, leave review
31. [ ] Rate clinic 5 stars
32. [ ] Write positive comment
33. [ ] Submit review
34. [ ] View review on clinic page

### E2E Journey 2: Complete Host Experience
**Persona:** Dr. Carlos, clinic owner

1. [ ] Register as dentist
2. [ ] Log in
3. [ ] Navigate to /become-host
4. [ ] Submit host request
5. [ ] Wait for admin approval (simulate)
6. [ ] Receive approval notification
7. [ ] Navigate to /clinic-dashboard
8. [ ] Click "Publicar Clínica"
9. [ ] Fill Step 1 (name, description, photos)
10. [ ] Upload 5 clinic photos
11. [ ] Set cover photo
12. [ ] Proceed to Step 2 (location)
13. [ ] Enter address, use location picker
14. [ ] Proceed to Step 3 (pricing, services)
15. [ ] Set price: RD$1,500/hour
16. [ ] Set min hours: 4
17. [ ] Select services and amenities
18. [ ] Proceed to Step 4 (policies)
19. [ ] Write clinic policies
20. [ ] Set rules (allowed/not allowed)
21. [ ] Review and submit
22. [ ] Wait for admin approval (simulate)
23. [ ] Receive approval notification
24. [ ] Clinic appears in search
25. [ ] Navigate to "Calendario" tab
26. [ ] View bookings calendar
27. [ ] Receive new booking notification
28. [ ] View booking details
29. [ ] Chat with dentist
30. [ ] Complete booking
31. [ ] Navigate to "Finanzas" tab
32. [ ] View pending balance
33. [ ] Request payout
34. [ ] Wait for admin processing (simulate)
35. [ ] Receive payout confirmation
36. [ ] Balance updated

### E2E Journey 3: Complete Admin Experience
**Persona:** Admin user managing platform

1. [ ] Log in as admin
2. [ ] Navigate to /admin-dashboard
3. [ ] View system statistics
4. [ ] Navigate to "Host Requests"
5. [ ] Approve pending host request
6. [ ] Navigate to "Clinic Validation"
7. [ ] Review pending clinic
8. [ ] Approve clinic publication
9. [ ] Navigate to "Booking Confirmation"
10. [ ] View pending Cardnet booking
11. [ ] Confirm payment received
12. [ ] Booking status → confirmed
13. [ ] Navigate to "Financials"
14. [ ] View host balances
15. [ ] Select hosts for payout
16. [ ] Create payout batch
17. [ ] Mark batch as paid
18. [ ] Navigate to "User Management"
19. [ ] Search for user
20. [ ] Edit user profile
21. [ ] Navigate to "Documents"
22. [ ] Approve dentist documents
23. [ ] Navigate to "System Settings"
24. [ ] Enable maintenance mode
25. [ ] Verify non-admin users blocked
26. [ ] Disable maintenance mode
27. [ ] View audit logs
28. [ ] Filter by action type
29. [ ] Export audit report (if implemented)

---

## Edge Cases & Boundary Conditions

### Edge Case Testing Scenarios

#### EC1: Concurrent Bookings
- [ ] User A selects time slot
- [ ] User B selects same slot simultaneously
- [ ] User A confirms first → slot blocked
- [ ] User B's confirmation rejected
- [ ] Error message displayed to User B
- [ ] Available slots refresh for User B

#### EC2: Expired Session During Booking
- [ ] User starts booking process
- [ ] Session expires mid-flow
- [ ] User clicks "Continuar al pago"
- [ ] Session validation fails
- [ ] User redirected to login
- [ ] Booking data preserved (if possible)
- [ ] After login, booking flow resumes

#### EC3: Payment Timeout (Cardnet)
- [ ] User creates pending booking
- [ ] User navigates to WhatsApp
- [ ] User doesn't complete payment
- [ ] 75 minutes pass
- [ ] Automatic expiration runs
- [ ] Booking status → 'cancelled'
- [ ] User notified of expiration

#### EC4: Duplicate Review Submission
- [ ] User submits review
- [ ] Review saved successfully
- [ ] User attempts to submit again (via direct API call)
- [ ] Database constraint blocks duplicate
- [ ] Error handled gracefully
- [ ] User informed review already exists

#### EC5: Photo Upload Exceeding Limit
- [ ] Clinic has 18 photos
- [ ] User attempts to upload 5 more
- [ ] Validation blocks upload (max 20)
- [ ] Error message displayed
- [ ] User can delete existing photos
- [ ] Upload retried successfully

#### EC6: Booking on Fully Booked Day
- [ ] Clinic has 14 1-hour bookings (7 AM - 9 PM)
- [ ] User selects that date
- [ ] Available slots query returns empty
- [ ] Message: "No hay horarios disponibles"
- [ ] User can select different date

#### EC7: Host Cancels Booking Minutes Before Start
- [ ] Booking starts in 30 minutes
- [ ] Host cancels
- [ ] Dentist receives urgent notification
- [ ] Full refund processed immediately
- [ ] Host marked for review (repeated cancellations)

#### EC8: Invalid Coordinates Saved
- [ ] Clinic creation with invalid lat/lng (null or out of bounds)
- [ ] Map fails to load
- [ ] Error boundary catches exception
- [ ] Fallback message displayed
- [ ] Admin notified to fix coordinates

#### EC9: Large File Upload (Avatar/Document)
- [ ] User selects 10MB image file
- [ ] Validation checks file size
- [ ] Error: "File size exceeds limit"
- [ ] User compresses/resizes image
- [ ] Upload succeeds

#### EC10: Rapid Filter Changes
- [ ] User changes province dropdown rapidly
- [ ] Municipality updates lag behind
- [ ] Debouncing prevents race conditions
- [ ] Final selection is accurate

---

## Performance & Optimization Testing

### Performance Benchmarks

#### PB1: Page Load Times
- [ ] Homepage: < 2 seconds (LCP)
- [ ] Search Clinics: < 3 seconds (with 50 clinics)
- [ ] Clinic Booking Page: < 2.5 seconds
- [ ] Admin Dashboard: < 3 seconds

#### PB2: Image Loading
- [ ] Cover images lazy load
- [ ] Placeholder displays during load
- [ ] Images fade in smoothly
- [ ] No layout shift (CLS < 0.1)

#### PB3: Search/Filter Performance
- [ ] Search results update < 300ms after typing stops
- [ ] Filter changes apply < 200ms
- [ ] Map updates without lag

#### PB4: Real-Time Updates
- [ ] New notification appears < 1 second
- [ ] Chat message delivered < 500ms
- [ ] Presence indicator updates instantly

#### PB5: Database Query Optimization
- [ ] Clinic search query < 500ms (50 clinics)
- [ ] Booking calendar load < 800ms
- [ ] Financial summary load < 1 second

---

## Security Testing

### Security Validation

#### SV1: Row-Level Security (RLS)
- [ ] **Profiles Table:**
  - [ ] User can view own profile
  - [ ] User cannot view other profiles (unless admin)
  - [ ] User can update own profile
  - [ ] User cannot delete profile (admin only)
- [ ] **Clinics Table:**
  - [ ] All users can view published clinics
  - [ ] Only host can view own unpublished clinics
  - [ ] Admin can view all clinics
  - [ ] Only host/admin can update clinic
- [ ] **Bookings Table:**
  - [ ] Dentist can view own bookings
  - [ ] Host can view bookings for own clinics
  - [ ] Admin can view all bookings
  - [ ] Only dentist/host/admin can update booking
- [ ] **Transactions Table:**
  - [ ] Admin can view all transactions
  - [ ] Host cannot view other hosts' transactions
  - [ ] Dentist cannot view transactions directly

#### SV2: Authentication Bypass Attempts
- [ ] Attempt to access /admin-dashboard without login → Redirect to /login
- [ ] Attempt to access /clinic-dashboard as dentist → Redirect to home
- [ ] Attempt to access protected API endpoint without token → 401 Unauthorized
- [ ] Attempt to access another user's profile via URL → 403 Forbidden

#### SV3: SQL Injection Prevention
- [ ] All queries use parameterized statements
- [ ] User input sanitized
- [ ] No raw SQL string concatenation

#### SV4: XSS Prevention
- [ ] User-generated content sanitized (DOMPurify)
- [ ] HTML tags escaped in reviews, descriptions
- [ ] Script tags blocked in inputs

#### SV5: CSRF Protection
- [ ] Supabase handles CSRF tokens
- [ ] No state-changing GET requests

#### SV6: File Upload Security
- [ ] File types validated (whitelist: jpg, png, gif, pdf)
- [ ] File size limits enforced
- [ ] Files scanned for malware (if implemented)
- [ ] Uploaded files served from storage domain (not app domain)

#### SV7: Sensitive Data Handling
- [ ] Passwords hashed (Supabase Auth)
- [ ] Bank account numbers partially masked in UI
- [ ] Admin cannot view raw passwords
- [ ] HTTPS enforced (production)

---

## Regression Testing

### Regression Test Scenarios
*Run after each major update*

#### RT1: Core Functionality Regression
- [ ] User registration still works
- [ ] Login still works
- [ ] Search clinics still works
- [ ] Booking flow still works
- [ ] Payment processing still works
- [ ] Notifications still work
- [ ] Chat still works

#### RT2: UI Consistency Regression
- [ ] All buttons styled correctly
- [ ] Colors match theme
- [ ] Fonts consistent
- [ ] Icons display correctly
- [ ] No layout breaks

#### RT3: Data Integrity Regression
- [ ] Old bookings still accessible
- [ ] Historic transactions intact
- [ ] User profiles unchanged
- [ ] Clinic data preserved
- [ ] Photos still load

#### RT4: Third-Party Integration Regression
- [ ] PayPal integration still works
- [ ] Supabase Auth still works
- [ ] Storage buckets accessible
- [ ] Email service functional
- [ ] Map tiles load

---

## Testing Completion Checklist

### Final Pre-Release Validation
- [ ] All critical paths tested and passed
- [ ] All modules tested individually
- [ ] Integration tests completed
- [ ] E2E journeys successful
- [ ] Edge cases handled
- [ ] Performance benchmarks met
- [ ] Security validation passed
- [ ] Accessibility standards met (WCAG AA)
- [ ] Mobile responsiveness verified
- [ ] Browser compatibility tested (Chrome, Firefox, Safari, Edge)
- [ ] Production environment tested (not just dev)
- [ ] Rollback plan prepared
- [ ] Monitoring/logging configured
- [ ] Support team trained
- [ ] User documentation prepared

---

## Testing Notes & Best Practices

### Testing Environment Setup
1. Use separate test Supabase project (or staging environment)
2. Populate test database with realistic data
3. Use test payment gateways (PayPal Sandbox, Cardnet test mode)
4. Create test user accounts for each role
5. Document test credentials securely

### Test Data Management
- Use consistent test data (e.g., "Test Clinic 1", "Test User A")
- Reset database to known state before critical tests
- Backup test database before destructive tests
- Clean up test data after completion (or use ephemeral environments)

### Bug Reporting Template
