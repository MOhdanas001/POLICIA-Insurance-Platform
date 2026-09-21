import bcrypt from 'bcryptjs';
import { query, pool, initDatabase } from './db';

export const seedData = async () => {
  console.log('--- Starting PostgreSQL Database Seeding ---');
  await initDatabase();

  const passwordHash = await bcrypt.hash('DemoAdmin@123', 10);
  const agentPasswordHash = await bcrypt.hash('DemoAgent@123', 10);
  const customerPasswordHash = await bcrypt.hash('DemoCustomer@123', 10);

  // 1. Create Admin User
  const adminRes = await query(`
    INSERT INTO users (email, password_hash, first_name, last_name, role_id)
    VALUES ($1, $2, $3, $4, $5)
    ON CONFLICT (email) DO UPDATE SET first_name = EXCLUDED.first_name
    RETURNING id;
  `, ['admin.demo@example.com', passwordHash, 'System', 'Admin', 'ROLE_ADMIN']);
  const adminId = adminRes.rows[0].id;

  // 2. Create Agents
  const agentData = [
    { email: 'agent.demo@example.com', pass: agentPasswordHash, firstName: 'Rahul', lastName: 'Verma', empId: 'AGT-1001', dept: 'Health & Claims' },
    { email: 'sarah.agent@example.com', pass: agentPasswordHash, firstName: 'Sarah', lastName: 'Jenkins', empId: 'AGT-1002', dept: 'Life & Travel' },
    { email: 'david.agent@example.com', pass: agentPasswordHash, firstName: 'David', lastName: 'Miller', empId: 'AGT-1003', dept: 'Vehicle & Property' },
  ];

  const agentIds: string[] = [];
  for (const ag of agentData) {
    const uRes = await query(`
      INSERT INTO users (email, password_hash, first_name, last_name, role_id)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (email) DO UPDATE SET first_name = EXCLUDED.first_name
      RETURNING id;
    `, [ag.email, ag.pass, ag.firstName, ag.lastName, 'ROLE_AGENT']);
    const uId = uRes.rows[0].id;

    const agRes = await query(`
      INSERT INTO agents (user_id, employee_id, department, status)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (employee_id) DO UPDATE SET department = EXCLUDED.department
      RETURNING id;
    `, [uId, ag.empId, ag.dept, 'ACTIVE']);
    agentIds.push(agRes.rows[0].id);
  }

  // 3. Create Customers
  const customerList = [
    { email: 'customer.demo@example.com', pass: customerPasswordHash, firstName: 'Anas', lastName: 'Khan', phone: '+91 98765 43210', address: 'Bandra West, Mumbai', agentIdx: 0 },
    { email: 'ahmed.customer@example.com', pass: customerPasswordHash, firstName: 'Ahmed', lastName: 'Ali', phone: '+91 98765 43211', address: 'Connaught Place, New Delhi', agentIdx: 0 },
    { email: 'priya.customer@example.com', pass: customerPasswordHash, firstName: 'Priya', lastName: 'Sharma', phone: '+91 98765 43212', address: 'Indiranagar, Bengaluru', agentIdx: 0 },
    { email: 'john.customer@example.com', pass: customerPasswordHash, firstName: 'John', lastName: 'Doe', phone: '+1 555 0192', address: '742 Evergreen Terrace, Springfield', agentIdx: 1 },
    { email: 'michael.customer@example.com', pass: customerPasswordHash, firstName: 'Michael', lastName: 'Brown', phone: '+1 555 0193', address: '123 Market St, San Francisco', agentIdx: 1 },
    { email: 'emma.customer@example.com', pass: customerPasswordHash, firstName: 'Emma', lastName: 'Watson', phone: '+44 20 7946 0912', address: 'Baker Street, London', agentIdx: 2 },
    { email: 'james.customer@example.com', pass: customerPasswordHash, firstName: 'James', lastName: 'Wilson', phone: '+1 555 0195', address: 'Oak Ridge, Chicago', agentIdx: 2 },
    { email: 'sophia.customer@example.com', pass: customerPasswordHash, firstName: 'Sophia', lastName: 'Taylor', phone: '+91 98765 43217', address: 'Jubilee Hills, Hyderabad', agentIdx: 0 },
    { email: 'robert.customer@example.com', pass: customerPasswordHash, firstName: 'Robert', lastName: 'Martinez', phone: '+1 555 0197', address: 'Sunset Blvd, Los Angeles', agentIdx: 1 },
    { email: 'olivia.customer@example.com', pass: customerPasswordHash, firstName: 'Olivia', lastName: 'Anderson', phone: '+1 555 0198', address: 'Fifth Avenue, New York', agentIdx: 2 },
  ];

  const customerIds: string[] = [];
  for (const c of customerList) {
    const uRes = await query(`
      INSERT INTO users (email, password_hash, first_name, last_name, role_id)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (email) DO UPDATE SET first_name = EXCLUDED.first_name
      RETURNING id;
    `, [c.email, c.pass, c.firstName, c.lastName, 'ROLE_CUSTOMER']);
    const uId = uRes.rows[0].id;

    const cRes = await query(`
      INSERT INTO customers (user_id, agent_id, phone, address)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT DO NOTHING
      RETURNING id;
    `, [uId, agentIds[c.agentIdx], c.phone, c.address]);

    let custId = cRes.rows[0]?.id;
    if (!custId) {
      const existing = await query(`SELECT id FROM customers WHERE user_id = $1`, [uId]);
      custId = existing.rows[0].id;
    }
    customerIds.push(custId);
  }

  // 4. Create Policies Master
  const policiesData = [
    {
      pNum: 'POL-H-1001',
      name: 'Health Secure Plus',
      type: 'Health',
      desc: 'Comprehensive medical coverage including pre/post hospitalization, ICU, day care procedures, and organ donor cover.',
      cov: 1000000,
      prem: 24000,
      freq: 'MONTHLY',
      eligibility: 'Individuals aged 18 to 65 years. No medical check-up required up to age 45.',
      terms: 'Covered: Hospitalization expenses over 24 hours, ambulance charges up to ₹5,000, ICU charges 100% covered. Room rent capped at ₹10,000/day.',
      exclusions: 'Pre-existing illnesses excluded for first 24 months. Cosmetic procedures, dental treatment (unless accident), self-inflicted injuries excluded.',
      benefits: 'Cashless treatment at 8,000+ network hospitals, tax benefit under Section 80D, annual free health checkup.',
      reqs: 'Original hospital bills, discharge summary, claim form signed by medical practitioner, valid photo ID proof.'
    },
    {
      pNum: 'POL-V-2001',
      name: 'Motor Shield Pro',
      type: 'Vehicle',
      desc: 'Comprehensive private car insurance covering third-party liability, personal accident, and zero-depreciation damage repair.',
      cov: 800000,
      prem: 18000,
      freq: 'MONTHLY',
      eligibility: 'Private four-wheeler vehicles less than 10 years old with valid RC.',
      terms: 'Own damage cover, third party liability up to ₹7.5 Lakhs, 24/7 roadside assistance included.',
      exclusions: 'Driving without valid license, driving under influence of alcohol/drugs, wear and tear of tires/tubes.',
      benefits: 'Zero depreciation bumper to bumper, engine protection add-on, towing assistance up to 50 km.',
      reqs: 'FIR copy for theft/major collision, claim form, RC copy, driving license copy, repair estimate from authorized garage.'
    },
    {
      pNum: 'POL-L-3001',
      name: 'Term Life Guarantee',
      type: 'Life',
      desc: 'High financial security term life plan assuring lump sum payout to family in case of untimely demise.',
      cov: 5000000,
      prem: 36000,
      freq: 'MONTHLY',
      eligibility: 'Non-smokers and smokers aged 21 to 55 years. Salaried & self-employed professionals.',
      terms: '100% sum assured paid to nominee upon policyholder death. Policy duration 20 years.',
      exclusions: 'Suicide within first 12 months of policy issuance.',
      benefits: 'Terminal illness benefit payout, tax savings under Section 80C, flexible payout options (lump sum or monthly income).',
      reqs: 'Death certificate, original policy document, nominee ID proof, medical report if requested.'
    },
    {
      pNum: 'POL-T-4001',
      name: 'Global Travel Care',
      type: 'Travel',
      desc: 'Worldwide travel coverage for medical emergencies, flight delays, trip cancellation, and lost passport.',
      cov: 1500000,
      prem: 12000,
      freq: 'MONTHLY',
      eligibility: 'Travelers aged 3 to 70 years traveling internationally.',
      terms: 'Emergency overseas medical expenses up to $200,000. Passport loss reimbursement up to $500.',
      exclusions: 'Adventure sports activities, travel against medical advice, unannounced trip cancellations.',
      benefits: 'Cashless hospitalization abroad, 24/7 global helpline, missed flight compensation.',
      reqs: 'Passport copy with visa stamp, boarding pass, medical bill/doctor report from international hospital.'
    },
    {
      pNum: 'POL-P-5001',
      name: 'Home Protection Shield',
      type: 'Property',
      desc: 'All-risk property insurance safeguarding home structure, contents, appliances against fire, flood, burglary, and natural disasters.',
      cov: 2500000,
      prem: 30000,
      freq: 'MONTHLY',
      eligibility: 'Residential property owners and tenants.',
      terms: 'Reinstatement value coverage for building structure and furniture/electronic items.',
      exclusions: 'Willful damage, war, nuclear perils, wear and gradual deterioration.',
      benefits: 'Temporary alternate accommodation expense cover, electrical breakdown cover.',
      reqs: 'Proof of property ownership, police complaint for burglary, itemized invoice of damaged contents.'
    },
    {
      pNum: 'POL-H-1002',
      name: 'Critical Illness Cover',
      type: 'Health',
      desc: 'Lump-sum payout upon diagnosis of 36 major critical illnesses including cancer, heart attack, stroke, and kidney failure.',
      cov: 2000000,
      prem: 28000,
      freq: 'MONTHLY',
      eligibility: 'Adults aged 18 to 60 years.',
      terms: 'Lump sum 100% payout upon first diagnosis after 90 days waiting period.',
      exclusions: 'Pre-existing critical illness diagnosed prior to policy commencement.',
      benefits: 'No hospital bill proof required — single lump sum payout for experimental treatments and lifestyle adaptation.',
      reqs: 'Biopsy/histopathology report, specialist consultant diagnosis certificate, policy document.'
    },
    {
      pNum: 'POL-H-1003',
      name: 'Personal Accident Plan',
      type: 'Health',
      desc: '24/7 worldwide financial shield against accidental death, permanent total disability, and temporary disability.',
      cov: 1200000,
      prem: 14000,
      freq: 'MONTHLY',
      eligibility: 'Working professionals aged 18 to 65 years.',
      terms: '100% payout for accidental death or permanent total disablement. Weekly income for temporary disablement.',
      exclusions: 'Self-injury, intoxication, military duty, hazardous activities.',
      benefits: 'Child education grant benefit up to ₹1,00,000 in case of accidental demise.',
      reqs: 'Post mortem report (if death), disability certificate from medical board, FIR copy.'
    },
    {
      pNum: 'POL-V-2002',
      name: 'Commercial Auto Fleet',
      type: 'Vehicle',
      desc: 'Comprehensive fleet insurance protection for commercial transport vehicles, taxis, and delivery vans.',
      cov: 4000000,
      prem: 60000,
      freq: 'MONTHLY',
      eligibility: 'Registered business entities owning commercial vehicle fleets.',
      terms: 'Comprehensive third-party liability + driver personal accident cover.',
      exclusions: 'Unlicensed driver, overloading vehicle beyond permit capacity.',
      benefits: 'Bulk fleet discount, priority claim clearance at network garages.',
      reqs: 'Commercial vehicle permit, driver badge copy, repair invoice from authorized service station.'
    }
  ];

  const policyIds: string[] = [];
  for (const p of policiesData) {
    const pRes = await query(`
      INSERT INTO policies (policy_number, name, policy_type, description, coverage_amount, annual_premium, payment_frequency, eligibility, terms_conditions, exclusions, benefits, claim_requirements, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      ON CONFLICT (policy_number) DO UPDATE SET name = EXCLUDED.name
      RETURNING id;
    `, [p.pNum, p.name, p.type, p.desc, p.cov, p.prem, p.freq, p.eligibility, p.terms, p.exclusions, p.benefits, p.reqs, 'ACTIVE']);
    const polId = pRes.rows[0].id;
    policyIds.push(polId);

    // Create initial policy version 1.0
    const vRes = await query(`
      INSERT INTO policy_versions (policy_id, version, effective_date, uploaded_by, status, document_url)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id;
    `, [polId, '1.0', '2026-01-01', adminId, 'PUBLISHED', `/documents/policies/${p.pNum}_v1.0.pdf`]);
    const verId = vRes.rows[0].id;

    // Create policy document metadata
    await query(`
      INSERT INTO policy_documents (policy_id, version_id, name, type, url, uploaded_by)
      VALUES ($1, $2, $3, $4, $5, $6);
    `, [polId, verId, `${p.name} Policy Wording & Terms (v1.0)`, 'PDF', `/documents/policies/${p.pNum}_v1.0.pdf`, adminId]);

    // Create Knowledge Base Text Chunks for RAG Vector Search
    const knowledgeDocRes = await query(`
      INSERT INTO knowledge_documents (policy_id, title, file_url, version)
      VALUES ($1, $2, $3, $4)
      RETURNING id;
    `, [polId, `${p.name} Comprehensive Policy Guide`, `/documents/policies/${p.pNum}_v1.0.pdf`, '1.0']);
    const kDocId = knowledgeDocRes.rows[0].id;

    const chunks = [
      {
        section: 'Coverage & Benefits',
        page: 2,
        content: `${p.name} provides a total sum insured of ₹${p.cov.toLocaleString('en-IN')}. ${p.desc} Key benefits include: ${p.benefits}`
      },
      {
        section: 'Exclusions & Waiting Period',
        page: 5,
        content: `Under ${p.name}, the following exclusions apply strictly: ${p.exclusions}`
      },
      {
        section: 'Terms & Conditions',
        page: 8,
        content: `Policy terms for ${p.name}: ${p.terms} Eligibility criteria: ${p.eligibility}`
      },
      {
        section: 'Claim Process & Documents Required',
        page: 12,
        content: `To file a claim under ${p.name}, the customer must submit: ${p.reqs}. Claims must be notified within 48 hours of emergency hospitalization or incident.`
      }
    ];

    for (const chunk of chunks) {
      // Create a dummy 768-dimensional normalized float array for vector demonstration
      const dummyVector = new Array(768).fill(0).map((_, i) => Math.sin((i + 1) * (polId.length)));
      const vectorStr = `[${dummyVector.join(',')}]`;

      await query(`
        INSERT INTO knowledge_chunks (document_id, policy_id, version, section, page_number, content, embedding)
        VALUES ($1, $2, $3, $4, $5, $6, $7);
      `, [kDocId, polId, '1.0', chunk.section, chunk.page, chunk.content, vectorStr]);
    }
  }

  // 5. Assign Customer Policies to Customer Anas Khan (customerIds[0])
  const demoCustomerId = customerIds[0];

  // Customer Anas Policy 1: Health Secure Plus
  const cp1Res = await query(`
    INSERT INTO customer_policies (customer_id, policy_id, policy_number, coverage_amount, premium, payment_frequency, status, start_date, end_date)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    RETURNING id;
  `, [demoCustomerId, policyIds[0], 'CP-H-88201', 1000000, 2000, 'MONTHLY', 'ACTIVE', '2026-01-01', '2026-12-31']);
  const cp1Id = cp1Res.rows[0].id;

  // Customer Anas Policy 2: Motor Shield Pro
  const cp2Res = await query(`
    INSERT INTO customer_policies (customer_id, policy_id, policy_number, coverage_amount, premium, payment_frequency, status, start_date, end_date)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    RETURNING id;
  `, [demoCustomerId, policyIds[1], 'CP-V-88202', 800000, 1500, 'MONTHLY', 'ACTIVE', '2026-02-15', '2027-02-14']);
  const cp2Id = cp2Res.rows[0].id;

  // Customer Anas Policy 3: Global Travel Care
  const cp3Res = await query(`
    INSERT INTO customer_policies (customer_id, policy_id, policy_number, coverage_amount, premium, payment_frequency, status, start_date, end_date)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    RETURNING id;
  `, [demoCustomerId, policyIds[3], 'CP-T-88204', 1500000, 1000, 'MONTHLY', 'ACTIVE', '2026-05-01', '2027-04-30']);
  const cp3Id = cp3Res.rows[0].id;

  // Assign policies to other customers as well
  for (let i = 1; i < customerIds.length; i++) {
    const polIndex = i % policyIds.length;
    await query(`
      INSERT INTO customer_policies (customer_id, policy_id, policy_number, coverage_amount, premium, payment_frequency, status, start_date, end_date)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9);
    `, [customerIds[i], policyIds[polIndex], `CP-GEN-990${i}`, 1000000, 2500, 'MONTHLY', 'ACTIVE', '2026-01-01', '2026-12-31']);
  }

  // 6. Create Claims for Customer Anas Khan
  // Open Claim: Emergency Appendectomy (#CLM-2026-00124)
  const claim1Res = await query(`
    INSERT INTO claims (claim_number, customer_id, customer_policy_id, policy_id, agent_id, claim_type, incident_date, description, claim_amount, approved_amount, status)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
    RETURNING id;
  `, [
    'CLM-2026-00124',
    demoCustomerId,
    cp1Id,
    policyIds[0],
    agentIds[0],
    'Inpatient Hospitalization',
    '2026-09-10',
    'Emergency appendectomy surgery performed at City Hospital Bandra. Required 3 days in ward + ICU observation.',
    45000,
    0,
    'UNDER_REVIEW'
  ]);
  const claim1Id = claim1Res.rows[0].id;

  // Status History Timeline for Claim 1
  const historyEntries = [
    { prev: null, next: 'SUBMITTED', comments: 'Claim application submitted by customer via portal with hospital pre-authorization form.', time: '2026-09-10 10:15:00' },
    { prev: 'SUBMITTED', next: 'UNDER_REVIEW', comments: 'Claim assigned to Senior Claims Agent Rahul Verma for verification.', time: '2026-09-12 14:30:00' },
    { prev: 'UNDER_REVIEW', next: 'DOCUMENT_REQUIRED', comments: 'Requested original itemized bill and hospital discharge summary.', time: '2026-09-14 09:45:00' },
    { prev: 'DOCUMENT_REQUIRED', next: 'UNDER_REVIEW', comments: 'Discharge summary and bills uploaded by customer. Final audit under review.', time: '2026-09-18 16:20:00' }
  ];

  for (const h of historyEntries) {
    await query(`
      INSERT INTO claim_status_history (claim_id, previous_status, new_status, comments, created_at)
      VALUES ($1, $2, $3, $4, $5::timestamp);
    `, [claim1Id, h.prev, h.next, h.comments, h.time]);
  }

  // Claim 1 Document Attachments
  await query(`
    INSERT INTO claim_documents (claim_id, name, file_type, file_url, file_size)
    VALUES 
    ($1, 'Discharge_Summary_CityHospital.pdf', 'PDF', '/uploads/claims/Discharge_Summary_CityHospital.pdf', 2450000),
    ($1, 'Hospital_Bill_Breakdown.pdf', 'PDF', '/uploads/claims/Hospital_Bill_Breakdown.pdf', 1820000);
  `, [claim1Id]);

  // Closed Claim 2: Bumper repair
  const claim2Res = await query(`
    INSERT INTO claims (claim_number, customer_id, customer_policy_id, policy_id, agent_id, claim_type, incident_date, description, claim_amount, approved_amount, status)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
    RETURNING id;
  `, [
    'CLM-2026-00088',
    demoCustomerId,
    cp2Id,
    policyIds[1],
    agentIds[0],
    'Vehicle Damage Repair',
    '2026-04-12',
    'Front bumper and headlamp repair following low speed parking collision.',
    18500,
    18500,
    'CLOSED'
  ]);

  await query(`
    INSERT INTO claim_status_history (claim_id, previous_status, new_status, comments)
    VALUES 
    ($1, NULL, 'SUBMITTED', 'Claim submitted with workshop repair estimate.'),
    ($1, 'SUBMITTED', 'APPROVED', 'Surveyor inspection verified. Full claim amount approved.'),
    ($1, 'APPROVED', 'SETTLEMENT', 'Settlement amount of ₹18,500 transferred to authorized garage.'),
    ($1, 'SETTLEMENT', 'CLOSED', 'Claim successfully settled and closed.');
  `, [claim2Res.rows[0].id]);

  // Closed Claim 3: Baggage loss
  const claim3Res = await query(`
    INSERT INTO claims (claim_number, customer_id, customer_policy_id, policy_id, agent_id, claim_type, incident_date, description, claim_amount, approved_amount, status)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
    RETURNING id;
  `, [
    'CLM-2026-00019',
    demoCustomerId,
    cp3Id,
    policyIds[3],
    agentIds[0],
    'Lost Baggage Reimbursement',
    '2026-01-20',
    'Baggage misplaced during international transit flight to Dubai.',
    12000,
    12000,
    'CLOSED'
  ]);

  await query(`
    INSERT INTO claim_status_history (claim_id, previous_status, new_status, comments)
    VALUES 
    ($1, NULL, 'SUBMITTED', 'Travel baggage claim filed with Property Irregularity Report.'),
    ($1, 'SUBMITTED', 'APPROVED', 'Airline confirmation letter verified.'),
    ($1, 'APPROVED', 'CLOSED', 'Claim amount of ₹12,000 disbursed to customer bank account.');
  `, [claim3Res.rows[0].id]);

  // 7. Payment Plan & Installments for Customer Anas (Health Secure Plus)
  const planRes = await query(`
    INSERT INTO payment_plans (customer_policy_id, total_amount, installment_amount, total_installments, frequency)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING id;
  `, [cp1Id, 24000, 2000, 12, 'MONTHLY']);
  const planId = planRes.rows[0].id;

  const months = ['2026-01-31', '2026-02-28', '2026-03-31', '2026-04-30', '2026-05-31', '2026-06-30', '2026-07-31', '2026-08-31', '2026-09-30', '2026-10-31', '2026-11-30', '2026-12-31'];

  for (let i = 0; i < 12; i++) {
    const instNum = i + 1;
    const isPaid = i < 8; // Jan to Aug paid
    const status = isPaid ? 'PAID' : (i === 8 ? 'PENDING' : 'UPCOMING');
    const paidDate = isPaid ? `2026-0${i + 1}-05 11:20:00` : null;

    const instRes = await query(`
      INSERT INTO installments (payment_plan_id, customer_id, installment_number, amount, due_date, status, paid_date)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id;
    `, [planId, demoCustomerId, instNum, 2000, months[i], status, paidDate]);

    if (isPaid) {
      await query(`
        INSERT INTO payments (installment_id, customer_id, amount, payment_method, transaction_id, status, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7);
      `, [instRes.rows[0].id, demoCustomerId, 2000, 'CARD', `TXN-2026-90${i + 1}`, 'PAID', paidDate]);
    }
  }

  // 8. Create Audit Logs
  const custUserRes = await query(`SELECT user_id FROM customers WHERE id = $1`, [demoCustomerId]);
  const demoCustomerUserId = custUserRes.rows[0]?.user_id || adminId;

  await query(`
    INSERT INTO audit_logs (user_id, action, resource, resource_id, old_value, new_value, ip_address)
    VALUES 
    ($1, 'CREATE_POLICY', 'Policy', $2, NULL, '{"name": "Health Secure Plus", "coverage": 1000000}'::jsonb, '127.0.0.1'),
    ($1, 'PUBLISH_POLICY_VERSION', 'PolicyVersion', $3, NULL, '{"version": "1.0"}'::jsonb, '127.0.0.1'),
    ($4, 'SUBMIT_CLAIM', 'Claim', $5, NULL, '{"amount": 45000, "type": "Inpatient"}'::jsonb, '192.168.1.15');
  `, [adminId, policyIds[0], policyIds[0], demoCustomerUserId, claim1Id]);

  console.log('--- PostgreSQL Database Seeding Complete ---');
  console.log('Demo Credentials Seeded Successfully:');
  console.log('  Admin:    admin.demo@example.com / DemoAdmin@123');
  console.log('  Agent:    agent.demo@example.com / DemoAgent@123');
  console.log('  Customer: customer.demo@example.com / DemoCustomer@123');
};

if (require.main === module) {
  seedData()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Seeding Error:', err);
      process.exit(1);
    });
}
