import { neon } from "@neondatabase/serverless";

export async function POST(request: Request) {
  try {
    console.log("=== API Route Started ===");

    // Check if DATABASE_URL is available
    if (!process.env.DATABASE_URL) {
      console.error("DATABASE_URL environment variable is not set");
      return Response.json(
        { error: "Database configuration error" },
        { status: 500 }
      );
    }

    const body = await request.json();
    console.log("Received request body:", JSON.stringify(body, null, 2));

    const {
      origin_address,
      destination_address,
      origin_latitude,
      origin_longitude,
      destination_latitude,
      destination_longitude,
      ride_time,
      fare_price,
      payment_status,
      driver_id,
      user_id,
    } = body;

    // Detailed validation
    const requiredFields = {
      origin_address,
      destination_address,
      origin_latitude,
      origin_longitude,
      destination_latitude,
      destination_longitude,
      ride_time,
      fare_price,
      payment_status,
      driver_id,
      user_id,
    };

    const missingFields = Object.entries(requiredFields)
      .filter(([key, value]) => !value && value !== 0)
      .map(([key]) => key);

    if (missingFields.length > 0) {
      console.error("Missing required fields:", missingFields);
      return Response.json(
        {
          error: "Missing required fields",
          missing_fields: missingFields,
          received_data: body,
        },
        { status: 400 }
      );
    }

    console.log(
      "All required fields present, attempting database connection..."
    );

    // Test database connection first
    const sql = neon(`${process.env.DATABASE_URL}`);

    // Simple test query to verify connection
    try {
      await sql`SELECT 1 as test`;
      console.log("Database connection successful");
    } catch (dbError: any) {
      console.error("Database connection failed:", dbError);
      return Response.json(
        { error: "Database connection failed", details: dbError.message },
        { status: 500 }
      );
    }

    console.log("Inserting ride data...");

    const response = await sql`
        INSERT INTO rides ( 
          origin_address, 
          destination_address, 
          origin_latitude, 
          origin_longitude, 
          destination_latitude, 
          destination_longitude, 
          ride_time, 
          fare_price, 
          payment_status, 
          driver_id, 
          user_id
        ) VALUES (
          ${origin_address},
          ${destination_address},
          ${parseFloat(origin_latitude)},
          ${parseFloat(origin_longitude)},
          ${parseFloat(destination_latitude)},
          ${parseFloat(destination_longitude)},
          ${ride_time},
          ${parseInt(fare_price)},
          ${payment_status},
          ${driver_id},
          ${user_id}
        )
        RETURNING *;
        `;

    console.log("Ride created successfully:", response[0]);
    return Response.json({ data: response[0] }, { status: 201 });
  } catch (error: any) {
    console.error("=== API Route Error ===");
    console.error("Error type:", error.constructor.name);
    console.error("Error message:", error.message);
    console.error("Error stack:", error.stack);

    // Check for specific error types
    if (error.message.includes('relation "rides" does not exist')) {
      return Response.json(
        {
          error:
            "Database table 'rides' does not exist. Please run database migrations.",
        },
        { status: 500 }
      );
    }

    if (error.message.includes("connection")) {
      return Response.json(
        {
          error: "Database connection error",
          details: error.message,
        },
        { status: 500 }
      );
    }

    return Response.json(
      {
        error: "Internal Server Error",
        details: error.message,
        type: error.constructor.name,
      },
      { status: 500 }
    );
  }
}
