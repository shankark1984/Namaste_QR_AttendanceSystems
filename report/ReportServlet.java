import java.io.IOException;
import java.io.InputStream;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;
import java.util.HashMap;
import java.util.Map;

import javax.servlet.ServletException;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import net.sf.jasperreports.engine.JasperCompileManager;
import net.sf.jasperreports.engine.JasperExportManager;
import net.sf.jasperreports.engine.JasperFillManager;
import net.sf.jasperreports.engine.JasperPrint;
import net.sf.jasperreports.engine.JasperReport;
import net.sf.jasperreports.engine.data.JRBeanCollectionDataSource;

@WebServlet("/generateReport")
public class ReportServlet extends HttpServlet {

    protected void doGet(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
        // Load your JDBC driver and establish a connection (if needed)
        try {
            Class.forName("com.mysql.jdbc.Driver");
            Connection conn = DriverManager.getConnection("jdbc:mysql://localhost:3306/yourdatabase", "username", "password");

            // Load and compile the Jasper report
            InputStream reportStream = this.getClass().getResourceAsStream("/reports/Transfer_of_Salaries_HDR.jasper");
            JasperReport jasperReport = (JasperReport) JasperCompileManager.compileReport(reportStream);

            // Parameters for the report
            Map<String, Object> parameters = new HashMap<>();
            parameters.put("Parameter1", "Value1");
            // Add more parameters as needed

            // Fetch data from your database or create a data source
            // Example with a dummy data source:
            JRBeanCollectionDataSource dataSource = new JRBeanCollectionDataSource(Collections.emptyList());

            // Fill the report with data and parameters
            JasperPrint jasperPrint = JasperFillManager.fillReport(jasperReport, parameters, conn);

            // Export the report to PDF (or other formats)
            byte[] reportBytes = JasperExportManager.exportReportToPdf(jasperPrint);

            // Set content type and provide the PDF bytes as response
            response.setContentType("application/pdf");
            response.setContentLength(reportBytes.length);
            response.getOutputStream().write(reportBytes);

            // Close the connection
            conn.close();
        } catch (ClassNotFoundException | SQLException | JRException e) {
            e.printStackTrace();
        }
    }
}
