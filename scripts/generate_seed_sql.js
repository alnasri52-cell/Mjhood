
const fs = require('fs');

const cities = [
    { name: 'Riyadh', lat: 24.7136, lng: 46.6753 },
    { name: 'Jeddah', lat: 21.5433, lng: 39.1728 },
    { name: 'Mecca', lat: 21.3891, lng: 39.8579 },
    { name: 'Medina', lat: 24.5247, lng: 39.5692 },
    { name: 'Dammam', lat: 26.4207, lng: 50.0888 },
    { name: 'Khobar', lat: 26.2172, lng: 50.1971 },
    { name: 'Dhahran', lat: 26.2672, lng: 50.1471 },
    { name: 'Buraydah', lat: 26.3660, lng: 43.9750 },
    { name: 'Taif', lat: 21.2703, lng: 40.4158 },
    { name: 'Tabuk', lat: 28.3838, lng: 36.5550 }
];

const cvTitles = ['Software Engineer', 'Graphic Designer', 'Accountant', 'Project Manager', 'Teacher', 'Nurse', 'Sales Representative', 'Marketing Specialist', 'Electrician', 'Plumber'];
const resourceTitles = ['Drill for Rent', 'Ladder', 'Projector', 'Camera', 'Event Hall', 'Truck for Hire', 'Generator', 'Gaming Console', 'Gardening Tools', 'Camping Gear'];
const resourceCategories = ['Tools & Equipment', 'Vehicles', 'Electronics', 'Electronics', 'Event Space', 'Vehicles', 'Tools & Equipment', 'Electronics', 'Garden Equipment', 'Sports Equipment'];

function generateUUID(index) {
    const hex = index.toString().padStart(12, '0');
    return `10000000-0000-0000-0000-${hex}`;
}

function randomOffset() {
    return (Math.random() * 0.1) - 0.05;
}

let sql = `-- Seed Batch 2: 50 CVs and 50 Resources across 10 Cities\n\n`;

// Drop FK constraints to allow test user IDs
sql += `ALTER TABLE cvs DROP CONSTRAINT IF EXISTS cvs_user_id_fkey;\n`;
sql += `ALTER TABLE resources DROP CONSTRAINT IF EXISTS resources_user_id_fkey;\n\n`;

// CVs (IDs 1-50)
sql += `-- CVs (50 items)\n`;
sql += `INSERT INTO cvs (user_id, full_name, job_title, summary, skills, work_experience, education, languages, "latitude", "longitude", created_at, updated_at) VALUES\n`;

let cvValues = [];
for (let i = 0; i < 50; i++) {
    const cityIndex = i % 10; // Distribute across 10 cities
    const city = cities[cityIndex];
    const userId = generateUUID(i + 1);
    const title = cvTitles[i % cvTitles.length];

    cvValues.push(`(
        '${userId}',
        'Test User ${i + 1}',
        '${title}',
        'Experienced ${title} with over 5 years of professionals experience in ${city.name}. Seeking new opportunities.',
        ARRAY['Skill A', 'Skill B', 'Skill C'],
        '[{"company": "Tech Corp", "position": "${title}", "duration": "2018-2023", "description": "Worked on various projects."}]'::jsonb,
        '[{"institution": "University of ${city.name}", "degree": "Bachelor", "year": "2018"}]'::jsonb,
        '[{"language": "Arabic", "proficiency": "Native"}, {"language": "English", "proficiency": "Fluent"}]'::jsonb,
        ${(city.lat + randomOffset()).toFixed(6)},
        ${(city.lng + randomOffset()).toFixed(6)},
        NOW(),
        NOW()
    )`);
}
sql += cvValues.join(',\n') + ';\n\n';

// Resources (IDs 51-100)
sql += `-- Resources (50 items)\n`;
sql += `INSERT INTO resources (user_id, title, description, category, "latitude", "longitude", availability_type, price_type, price_min, price_currency, contact_method, created_at, updated_at) VALUES\n`;

let resValues = [];
for (let i = 0; i < 50; i++) {
    const cityIndex = i % 10;
    const city = cities[cityIndex];
    const userId = generateUUID(i + 51);
    const title = resourceTitles[i % resourceTitles.length];
    const category = resourceCategories[i % resourceCategories.length];

    resValues.push(`(
        '${userId}',
        '${title}',
        'High quality ${title} available in ${city.name}. Contact for more details.',
        '${category}',
        ${(city.lat + randomOffset()).toFixed(6)},
        ${(city.lng + randomOffset()).toFixed(6)},
        'rent',
        'fixed',
        ${100 + (i * 10)},
        'SAR',
        'both',
        NOW(),
        NOW()
    )`);
}
sql += resValues.join(',\n') + ';\n';

fs.writeFileSync('migrations/seed_batch_2_cvs_resources.sql', sql);
console.log('SQL file generated!');
