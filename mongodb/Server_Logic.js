const Employee = require('./models/Employee_Collection');
const Certificate = require('./models/certificate'); // Import the certificate schema
const CustomerInfo = require('./models/customerInfoCollection');

// Import the Complaint model
const Complaint = require('./models/Complaints'); // Assuming your model is in a separate file

const { v4: uuidv4 } = require('uuid');
const QRCode = require('qrcode');

const multer = require('multer');

// Define the storage for multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); // Set the destination folder for storing uploaded images
  },
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    cb(null, `${timestamp}-${file.originalname}`); // Set a unique filename for each uploaded image
  },
});

// Create a multer instance with the defined storage
const upload = multer({ storage: storage });
let currentAgent = 2000; // Initialize the current order number

const generateAgentId = () => {
  currentAgent++; // Increment the order number
  return `CM${currentAgent}`; // Generate the ordered ID
};
const createAgent = async (req, res) => {
  try {
    const empId = generateAgentId();

    const Agent = {
      empId,
     userName: req.body.userName,
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      email: req.body.email,
      phone: req.body.phone,
      activeState: req.body.activeState,
      role: req.body.role,
      password: req.body.password,
      designation: req.body.designation,
      jobType: req.body.jobType,
      jobDescription: req.body.jobDescription,
      image:  req.body.image,
      rating: req.body.rating,
      review: req.body.review,
      serviceType: req.body.serviceType,
      workExperience: req.body.workExperience,
      qrCode: req.body.qrCode,
      certification: req.body.certification || [], // Use the provided certification array or an empty array if not provided
    };

    const newEmployee = new Employee(Agent);
    await newEmployee.save(); // Save the new employee document to the database
    res.status(201).json(newEmployee);
  } catch (error) {
    console.error('Error creating agent:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

const createCertificate = async (req, res) => {
    try {
      const certificateData = {
        certificateId: req.body.certificateId,
        name: req.body.name,
        type: req.body.type,
        description: req.body.description,
        duration: req.body.duration,
      };
  
      const newCertificate = new Certificate(certificateData);
      await newCertificate.save(); // Save the new certificate document to the database
      res.status(201).json(newCertificate);
    } catch (error) {
      console.error('Error creating certificate:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  };


  const getAllCertificates = async (req, res) => {
    try {
      const certificates = await Certificate.find(); // Retrieve all certificates from the database
      res.status(200).json(certificates);
    } catch (error) {
      console.error('Error retrieving certificates:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  };

  const getAllEmployees = async (req, res) => {
    try {
      const employees = await Employee.find(); // Retrieve all certificates from the database
      res.status(200).json(employees);
    } catch (error) {
      console.error('Error retrieving certificates:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  };

  const getAllEmployeesByID = async (req, res) => {
    try {
      const { empId } = req.params; // Get the serviceType from URL parameters
  
      const employees = await Employee.find({ empId }); // Retrieve employees with the specified serviceType
  
      if (!employees || employees.length === 0) {
        return res.status(404).json({ error: 'No employees found for the given serviceType' });
      }
  
      res.status(200).json(employees);
    } catch (error) {
      console.error('Error retrieving employees by serviceType:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  };

  const getAllEmployeesByServiceType = async (req, res) => {
    try {
      const { serviceType } = req.params; // Get the serviceType from URL parameters
  
      const employees = await Employee.find({ serviceType }); // Retrieve employees with the specified serviceType
  
      if (!employees || employees.length === 0) {
        return res.status(404).json({ error: 'No employees found for the given serviceType' });
      }
  
      res.status(200).json(employees);
    } catch (error) {
      console.error('Error retrieving employees by serviceType:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  };
  






  const nodemailer = require('nodemailer');

  // Function to generate a random OTP
  function generateOTP() {
    return Math.floor(1000 + Math.random() * 9000); // Generate a 4-digit OTP
  }
  
  // Function to send OTP via email
  function sendOTPviaEmail(email, otp) {
    const transporter = nodemailer.createTransport({
      service: 'Gmail', // e.g., 'Gmail'
      auth: {
        user: 'barnbastelagareddy123@gmail.com',
        pass: 'bfeokdbsgiixadtm',
      },
    });
  
    const mailOptions = {
      from: 'barnbastelagareddy123@gmail.com',
      to: email,
      subject: 'Your OTP for QR Code Validation',
      text: `Your OTP is: ${otp}`,
    };
  
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error('Error sending OTP:', error);
      } else {
        console.log('OTP sent:', info.response);
      }
    });
  }
  
  const otpCache = {}; // Cache to store OTPs
  

  const sendingOtp = async (req, res) => {
    try {
      const { empId, email } = req.params; // Get the employee ID and email from URL parameters
      const otp = generateOTP(); // Generate an OTP
  
      // Send the OTP via email
      sendOTPviaEmail(email, otp);
  
      // Save the OTP in a cache for verification
      otpCache[empId] = otp;
  
      res.status(200).json({ message: 'OTP sent via email' });
    } catch (error) {
      console.error('Error generating OTP:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  };
  


  const getAllEmployeesWithQR = async (req, res) => {
    try {
      const { empId } = req.params; // Get the employee ID from URL parameters
      const { userEnteredOTP } = req.body; // Get userEnteredOTP from the request body

      // Retrieve the employee from the database based on the provided empId as a string
      const employee = await Employee.findOne({ empId });
  
      if (!employee) {
        return res.status(404).json({ error: 'Employee not found' });
      }
  
      const certificationsData = employee.certifications.map((certification) => {
        return `Certificate ID: ${certification.certificateId}, Status: ${certification.status},
        PendingDays: ${certification.pendingDays}`;
      });
  
      const certificationsInfo = certificationsData.join('\n'); // Join the certification data with line breaks
  
      if (userEnteredOTP && otpCache[empId] === userEnteredOTP) {

        // If OTP is valid, proceed to generate and display the QR code
  
        // Generate the QR code data using the employee's data, including empId
        const data = ` ID: ${employee.empId},  Name: ${employee.userName},
        Email: ${employee.email}, Phone: ${employee.phone},
         Role: ${employee.role}, Designation: ${employee.designation}, 
         Job Type: ${employee.jobType}, Job Description: ${employee.jobDescription},
          Rating: ${employee.rating}, Review: ${employee.review}, Service Type: ${employee.serviceType},
           Work Experience: ${employee.workExperience}, Certifications:\n${certificationsInfo}`;
        const qrCodeFileName = `${employee.userName}-${employee.empId}.png`;
  
        await generateQRCode(data, qrCodeFileName);
        res.sendFile(qrCodeFileName, { root: __dirname });
  
        res.status(200).json({ message: 'QR code generated for the employee' });
      } else {
        res.status(401).json({ error: 'Invalid OTP' });
      }
    } catch (error) {
      console.error('Error generating QR code:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  };
  
  async function generateQRCode(data, fileName) {
    return new Promise((resolve, reject) => {
      QRCode.toFile(fileName, data, (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }
  
  





  // customerInfoController.js
  let currentOrder = 3000; // Initialize the current order number

const generateOrderedId = () => {
  currentOrder++; // Increment the order number
  return `CU${currentOrder}`; // Generate the ordered ID
};
  const createCustomer = async (req, res) => {
    try {
      // Generate a unique customerId
      const customerId = generateOrderedId();
      const currentDate = new Date();
      const utcDate = currentDate.toISOString();

      // Construct the customer data
      const customerData = {
        customerId, // Automatically generated customerId
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        phone: req.body.phone,
        email: req.body.email,
        type: req.body.type,
        date: utcDate, // Automatically captures the current date and time in UTC format
        description: req.body.description,
        status: req.body.status,
        address:req.body.address,
      };
      const newCustomer = new CustomerInfo(customerData);
      await newCustomer.save(); // Save the new customer document to the database
      res.status(201).json(newCustomer);
    } catch (error) {
      console.error('Error creating customer:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  };
  
  const getAllCustomers = async (req, res) => {
    try {
      const customers = await CustomerInfo.find(); // Retrieve all customers from the database
      res.status(200).json(customers);
    } catch (error) {
      console.error('Error retrieving customers:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  };
  const updateCustomerStatus = async (customerId, status) => {
    try {
      const updatedCustomer = await CustomerInfo.findOneAndUpdate(
        { customerId },
        { $set: { status } },
        { new: true }
      );
      return updatedCustomer;
    } catch (error) {
      console.error('Error updating customer status:', error);
      throw new Error('Internal Server Error');
    }
  };






const getcustomerById = async (req, res) => {
  try {
    const { customerId } = req.params;

    const complaint = await CustomerInfo.findOne({ customerId }); // Retrieve a Complaint with the specified complaintId

    if (!complaint) {
      return res.status(404).json({ error: 'No complaint found for the given complaintId' });
    }

    res.status(200).json(complaint);
  } catch (error) {
    console.error('Error retrieving complaint by ID:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};
const getComplaints = async (req, res) => {
  try {
    const complaints = await Complaint.find(); // Retrieve all Complaints from the database
    res.status(200).json(complaints);
  } catch (error) {
    console.error('Error retrieving complaints:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

const getComplaintById = async (req, res) => {
  try {
    const { complaintId } = req.params;

    const complaint = await Complaint.findOne({ complaintId }); // Retrieve a Complaint with the specified complaintId

    if (!complaint) {
      return res.status(404).json({ error: 'No complaint found for the given complaintId' });
    }

    res.status(200).json(complaint);
  } catch (error) {
    console.error('Error retrieving complaint by ID:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};



const getComplaintData = async (req, res) => {
  try {
      const complaintId = req.params.complaintId; // Assuming complaintId is in the request parameters

      // Find the complaint document by complaintId
      const complaint = await Complaint.findOne({ complaintId });

      if (!complaint) {
          return res.status(404).json({ error: 'Complaint not found' });
      }

      // Fetch customer data based on customerId from the complaint
      const customer = await CustomerInfo.findOne({ customerId: complaint.customerId });

      if (!customer) {
          return res.status(404).json({ error: 'Customer not found' });
      }

      // Fetch agent data based on agentId from the complaint
      const agent = await Employee.findOne({ empId: complaint.agentId });

      if (!agent) {
          return res.status(404).json({ error: 'Agent not found' });
      }

      // Combine all the information and send it as a response
      const response = {
          complaint,
          customer,
          agent,
      };

      res.status(200).json(response);
  } catch (error) {
      console.error('Error fetching complaint data:', error);
      res.status(500).json({ error: 'Internal Server Error' });
  }
};


const getAllComplaints = async (req, res) => {
  try {
    // Find all documents from the Complaint collection and exclude the _id field
    const complaints = await Complaint.find({}, { _id: 0 });

    if (!complaints || complaints.length === 0) {
      return res.status(404).json({ error: 'No complaints found' });
    }

    const data = [];

    for (const complaint of complaints) {
      // Fetch customer data based on customerId from the complaint and exclude the _id field
      const customer = await CustomerInfo.findOne({ customerId: complaint.customerId }, { _id: 0 });

      // Fetch agent data based on agentId from the complaint and exclude the _id field
      const agent = await Employee.findOne({ empId: complaint.agentId }, { _id: 0 });

      // Combine all the information into a single object
      const response = {
        complaint,
        customer,
        agent,
      };

      data.push(response);
    }

    res.status(200).json(data);
  } catch (error) {
    console.error('Error fetching data:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};





const transporter = nodemailer.createTransport({
  service: 'Gmail', // e.g., 'Gmail'
  auth: {
    user: 'barnbastelagareddy123@gmail.com',
    pass: 'bfeokdbsgiixadtm',
  },
});

let complaintdataId = 4000; // Initialize the current complaint ID

const generateComplaintId = () => {
  complaintdataId++; // Increment the complaint ID
  return `CM${complaintdataId}`; // Generate the complaint ID
};

const createComplaint = async (req, res) => {
  try {
    const complaintId = generateComplaintId();

    const complaintData = {
      complaintId,
      customerId: req.body.customerId,
      agentId: req.body.agentId,
    };


      const newComplaint = new Complaint(complaintData);
      await newComplaint.save(); // Save the new complaint document to the database

      // Fetch customer data based on customerId
      const customer = await CustomerInfo.findOne({ customerId: req.body.customerId });

      if (!customer) {
          return res.status(404).json({ error: 'Customer not found' });
      }

      // Fetch agent data based on agentId
      const agent = await Employee.findOne({ empId: req.body.agentId });

      if (!agent) {
          return res.status(404).json({ error: 'Agent not found' });
      }

      // Send an email to the customer
      const customerMailOptions = {
          from: 'barnbastelagareddy123@gmail.com',
          to: customer.email, // Assuming you have an 'email' field in the customer document
          subject: 'Complaint Created',
          text: `Hi ${customer.firstName}, your complaint has been successfully created. It has been assigned to ${agent.firstName}  ${agent.lastName}.Thank you for reaching out!`,
        };

      // Send an email to the agent
      const agentMailOptions = {
          from: 'barnbastelagareddy123@gmail.com',
          to: agent.email, // Assuming you have an 'email' field in the agent document
          subject: 'New Complaint Assigned',
          text: `Hi ${agent.firstName}, a new complaint has been assigned to you. It belongs to ${customer.firstName}  ${customer.lastName}. Please take action accordingly.`,
        };

      transporter.sendMail(customerMailOptions, (customerError) => {
          if (customerError) {
              console.error('Error sending email to customer:', customerError);
          }
          transporter.sendMail(agentMailOptions, (agentError) => {
              if (agentError) {
                  console.error('Error sending email to agent:', agentError);
              }
              res.status(201).json({ complaint: newComplaint, customer, agent });
          });
      });
  } catch (error) {
      console.error('Error creating complaint:', error);
      res.status(500).json({ error: 'Internal Server Error' });
  }
};



module.exports = {getAllComplaints,getComplaintData,getcustomerById,getComplaints,getComplaintById,getAllEmployeesByID,createComplaint,getAllEmployeesByServiceType,sendingOtp,createAgent,createCertificate ,getAllCertificates ,getAllEmployees ,createCustomer,getAllEmployeesWithQR,getAllCustomers,updateCustomerStatus};
