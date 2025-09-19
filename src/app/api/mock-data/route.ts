import { NextRequest, NextResponse } from 'next/server';

// Mock data generator for different entity types
const generateMockData = (entityType: string, count: number = 100) => {
  const mockDataGenerators = {
    users: () => ({
      id: Math.random().toString(36).substr(2, 9),
      name: randomName(),
      email: randomEmail(),
      role: randomChoice(['admin', 'user', 'manager', 'viewer']),
      status: randomChoice(['active', 'inactive', 'pending', 'suspended']),
      department: randomChoice(['Engineering', 'Marketing', 'Sales', 'HR', 'Finance']),
      salary: Math.floor(Math.random() * 150000) + 50000,
      joinDate: randomDate(),
      lastActive: randomDate(),
      tags: randomTags(),
      profile: {
        avatar: `https://test.abh1noob.in/150?img=${Math.floor(Math.random() * 70)}`,
        phone: randomPhone(),
        address: randomAddress()
      }
    }),
    
    products: () => ({
      id: `prod_${Math.random().toString(36).substr(2, 9)}`,
      name: randomProductName(),
      price: Math.floor(Math.random() * 2000) + 10,
      category: randomChoice(['Electronics', 'Clothing', 'Books', 'Home', 'Sports']),
      brand: randomChoice(['Apple', 'Samsung', 'Nike', 'Adidas', 'Sony', 'LG']),
      rating: Math.floor(Math.random() * 5) + 1,
      stock: Math.floor(Math.random() * 1000),
      inStock: Math.random() > 0.1,
      description: randomDescription(),
      createdAt: randomDate(),
      tags: randomTags(),
      variants: randomVariants()
    }),
    
    orders: () => ({
      id: `ord_${Math.random().toString(36).substr(2, 9)}`,
      orderNumber: `ORD-${Math.floor(Math.random() * 100000)}`,
      customer: {
        name: randomName(),
        email: randomEmail()
      },
      total: Math.floor(Math.random() * 5000) + 100,
      status: randomChoice(['pending', 'processing', 'shipped', 'delivered', 'cancelled']),
      priority: randomChoice(['low', 'medium', 'high', 'urgent']),
      paymentMethod: randomChoice(['credit_card', 'paypal', 'bank_transfer', 'cash']),
      shippingAddress: randomAddress(),
      orderDate: randomDate(),
      estimatedDelivery: randomDate(),
      items: randomOrderItems()
    })
  };

  const generator = mockDataGenerators[entityType as keyof typeof mockDataGenerators];
  if (!generator) {
    throw new Error(`Unknown entity type: ${entityType}`);
  }

  return Array.from({ length: count }, () => generator());
};

// Helper functions for generating random data
function randomName() {
  const firstNames = ['John', 'Jane', 'Bob', 'Alice', 'Charlie', 'Diana', 'Edward', 'Fiona', 'George', 'Helen'];
  const lastNames = ['Smith', 'Johnson', 'Brown', 'Davis', 'Miller', 'Wilson', 'Moore', 'Taylor', 'Anderson', 'Thomas'];
  return `${randomChoice(firstNames)} ${randomChoice(lastNames)}`;
}

function randomEmail() {
  const domains = ['gmail.com', 'yahoo.com', 'outlook.com', 'company.com'];
  const username = Math.random().toString(36).substr(2, 8);
  return `${username}@${randomChoice(domains)}`;
}

function randomChoice(arr: any[]) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomDate() {
  const start = new Date(2020, 0, 1);
  const end = new Date();
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime())).toISOString();
}

function randomTags() {
  const allTags = ['frontend', 'backend', 'react', 'typescript', 'node', 'python', 'important', 'urgent', 'reviewed'];
  const numTags = Math.floor(Math.random() * 4) + 1;
  const shuffled = [...allTags].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, numTags);
}

function randomPhone() {
  return `+1 (${Math.floor(Math.random() * 900) + 100}) ${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 9000) + 1000}`;
}

function randomAddress() {
    const streets = ['MG Road', 'Park Street', 'Brigade Road', 'Commercial Street', 'Linking Road'];
    const cities = ['Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Kolkata'];
    const states = ['MH', 'KL', 'KA', 'TN', 'GJ'];
    return {
        street: `${Math.floor(Math.random() * 9999) + 1} ${randomChoice(streets)}`,
        city: randomChoice(cities),
        state: randomChoice(states),
        zipCode: `${Math.floor(Math.random() * 900000) + 100000}`
    };
}

function randomProductName() {
  const adjectives = ['Premium', 'Pro', 'Ultra', 'Smart', 'Wireless', 'Digital'];
  const nouns = ['Headphones', 'Laptop', 'Phone', 'Watch', 'Tablet', 'Camera'];
  return `${randomChoice(adjectives)} ${randomChoice(nouns)}`;
}

function randomDescription() {
  const descriptions = [
    'High-quality product with excellent features',
    'Perfect for everyday use',
    'Professional grade equipment',
    'Affordable and reliable',
    'Latest technology integrated'
  ];
  return randomChoice(descriptions);
}

function randomVariants() {
  const colors = ['Black', 'White', 'Blue', 'Red', 'Green'];
  const sizes = ['S', 'M', 'L', 'XL'];
  return Array.from({ length: Math.floor(Math.random() * 3) + 1 }, () => ({
    color: randomChoice(colors),
    size: randomChoice(sizes),
    stock: Math.floor(Math.random() * 50)
  }));
}

function randomOrderItems() {
  const products = ['Laptop', 'Mouse', 'Keyboard', 'Monitor', 'Headphones'];
  return Array.from({ length: Math.floor(Math.random() * 4) + 1 }, () => ({
    product: randomChoice(products),
    quantity: Math.floor(Math.random() * 5) + 1,
    price: Math.floor(Math.random() * 500) + 50
  }));
}

// Main API handler
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Extract query parameters
    const entityType = searchParams.get('type') || 'users';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    
    // Extract filters (any other query params)
    const filters: Record<string, string> = {};
    searchParams.forEach((value, key) => {
      if (!['type', 'page', 'limit', 'search'].includes(key)) {
        filters[key] = value;
      }
    });

    // Generate complete dataset
    const allData = generateMockData(entityType, 1000);
    
    // Apply search filter
    let filteredData = allData;
    if (search) {
      filteredData = allData.filter(item => 
        JSON.stringify(item).toLowerCase().includes(search.toLowerCase())
      );
    }
    
    // Apply column filters
    Object.entries(filters).forEach(([key, value]) => {
      if (value && value !== 'all') {
        filteredData = filteredData.filter(item => {
          const itemValue = getNestedValue(item, key);
          return itemValue && itemValue.toString().toLowerCase().includes(value.toLowerCase());
        });
      }
    });
    
    // Calculate pagination
    const total = filteredData.length;
    const totalPages = Math.ceil(total / limit);
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedData = filteredData.slice(startIndex, endIndex);
    
    // Return response with metadata
    return NextResponse.json({
      success: true,
      data: paginatedData,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      },
      filters: filters,
      search: search
    });
    
  } catch (error) {
    console.error('Mock API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch data' }, 
      { status: 500 }
    );
  }
}

// Helper function to get nested object values
function getNestedValue(obj: any, path: string): any {
  return path.split('.').reduce((current, key) => {
    return current && current[key] !== undefined ? current[key] : null;
  }, obj);
}