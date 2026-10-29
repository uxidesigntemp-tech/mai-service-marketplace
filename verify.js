const fs = require('fs');
const path = require('path');

const code1 = fs.readFileSync(path.join(__dirname, 'client', 'public', 'dashboard-components.js'), 'utf8');
const code2 = fs.readFileSync(path.join(__dirname, 'client', 'public', 'app.js'), 'utf8');
const code = code1 + '\n' + code2;

const reqs = [
  'Header', 'HomePage', 'CategoriesPage', 'ServiceListingPage', 'ProfessionalsPage',
  'ServiceDetailPage', 'ProfessionalProfilePage', 'ExplorePage', 'ExploreDetailPage',
  'Footer', 'DashboardLayout', 'Sidebar', 'DashboardHeader', 'ClientDashboardHome',
  'MyBookingsPage', 'PaymentsPage', 'MessagesPage', 'SavedProfilesPage', 'SettingsPage',
  'UserProfilePage', 'ProfessionalDashboard', 'BookingModal', 'BookingDetailModal',
  'InvoiceModal', 'ChatModal', 'ReviewModal', 'PostRequirementModal', 'BecomeProModal',
  'CreateServiceModal', 'RescheduleModal', 'AuthModal'
];

let allOk = true;
reqs.forEach(c => {
  const found = code.includes('function ' + c) || code.includes('const ' + c + ' =') || code.includes('function ' + c + '(');
  if (!found) {
    console.log('MISSING:', c);
    allOk = false;
  } else {
    console.log('OK:', c);
  }
});

if (allOk) {
  console.log('\n>>> ALL 31 REQUIRED COMPONENTS ARE DEFINED IN APP.JS! <<<');
}
