package pe.airconsolution.api.invoice.sunat;

import java.io.StringReader;
import java.io.StringWriter;
import java.util.Base64;
import java.util.List;

import javax.xml.XMLConstants;
import javax.xml.crypto.dsig.CanonicalizationMethod;
import javax.xml.crypto.dsig.DigestMethod;
import javax.xml.crypto.dsig.Reference;
import javax.xml.crypto.dsig.SignatureMethod;
import javax.xml.crypto.dsig.SignedInfo;
import javax.xml.crypto.dsig.Transform;
import javax.xml.crypto.dsig.XMLSignature;
import javax.xml.crypto.dsig.XMLSignatureFactory;
import javax.xml.crypto.dsig.dom.DOMSignContext;
import javax.xml.crypto.dsig.keyinfo.KeyInfo;
import javax.xml.crypto.dsig.keyinfo.KeyInfoFactory;
import javax.xml.crypto.dsig.keyinfo.X509Data;
import javax.xml.crypto.dsig.spec.C14NMethodParameterSpec;
import javax.xml.crypto.dsig.spec.TransformParameterSpec;
import javax.xml.parsers.DocumentBuilderFactory;
import javax.xml.transform.OutputKeys;
import javax.xml.transform.Transformer;
import javax.xml.transform.TransformerFactory;
import javax.xml.transform.dom.DOMSource;
import javax.xml.transform.stream.StreamResult;

import org.w3c.dom.Document;
import org.w3c.dom.Element;
import org.w3c.dom.NodeList;
import org.xml.sax.InputSource;

/**
 * Firma XML-DSig "enveloped" según la guía de SUNAT: la firma (Id = SignatureSP) va dentro de
 * ext:UBLExtensions/ext:UBLExtension/ext:ExtensionContent. El DigestValue es el "valor resumen" (hash)
 * que se imprime en la representación impresa y en el código QR.
 */
public final class XmlSigner {

    public static final String EXT_NS = "urn:oasis:names:specification:ubl:schema:xsd:CommonExtensionComponents-2";
    public static final String SIGNATURE_ID = "SignatureSP";

    public record Signed(String xml, String digestValue) {
    }

    private XmlSigner() {
    }

    public static Signed sign(String unsignedXml, SunatCertificate cert) {
        try {
            Document doc = parse(unsignedXml);
            NodeList contents = doc.getElementsByTagNameNS(EXT_NS, "ExtensionContent");
            if (contents.getLength() == 0) {
                throw new IllegalStateException("El XML no tiene ext:ExtensionContent para la firma.");
            }
            Element target = (Element) contents.item(contents.getLength() - 1);

            XMLSignatureFactory fac = XMLSignatureFactory.getInstance("DOM");
            Reference ref = fac.newReference("", fac.newDigestMethod(DigestMethod.SHA1, null),
                    List.of(fac.newTransform(Transform.ENVELOPED, (TransformParameterSpec) null)), null, null);
            SignedInfo signedInfo = fac.newSignedInfo(
                    fac.newCanonicalizationMethod(CanonicalizationMethod.INCLUSIVE, (C14NMethodParameterSpec) null),
                    fac.newSignatureMethod(SignatureMethod.RSA_SHA1, null), List.of(ref));

            KeyInfoFactory kif = fac.getKeyInfoFactory();
            X509Data x509 = kif.newX509Data(List.of(
                    cert.certificate().getSubjectX500Principal().getName(), cert.certificate()));
            KeyInfo keyInfo = kif.newKeyInfo(List.of(x509));

            DOMSignContext ctx = new DOMSignContext(cert.privateKey(), target);
            ctx.setDefaultNamespacePrefix("ds");
            XMLSignature signature = fac.newXMLSignature(signedInfo, keyInfo, null, SIGNATURE_ID, null);
            signature.sign(ctx);

            String digest = Base64.getEncoder().encodeToString(ref.getDigestValue());
            return new Signed(serialize(doc), digest);
        } catch (IllegalStateException e) {
            throw e;
        } catch (Exception e) {
            throw new IllegalStateException("No se pudo firmar el comprobante: " + e.getMessage(), e);
        }
    }

    /** Parser con DOCTYPE y entidades externas deshabilitados. */
    public static Document parse(String xml) throws Exception {
        return parse(new InputSource(new StringReader(xml)));
    }

    public static Document parse(InputSource source) throws Exception {
        DocumentBuilderFactory dbf = DocumentBuilderFactory.newInstance();
        dbf.setNamespaceAware(true);
        dbf.setFeature(XMLConstants.FEATURE_SECURE_PROCESSING, true);
        dbf.setFeature("http://apache.org/xml/features/disallow-doctype-decl", true);
        dbf.setXIncludeAware(false);
        dbf.setExpandEntityReferences(false);
        return dbf.newDocumentBuilder().parse(source);
    }

    static String serialize(Document doc) throws Exception {
        TransformerFactory tf = TransformerFactory.newInstance();
        tf.setAttribute(XMLConstants.ACCESS_EXTERNAL_DTD, "");
        tf.setAttribute(XMLConstants.ACCESS_EXTERNAL_STYLESHEET, "");
        Transformer t = tf.newTransformer();
        t.setOutputProperty(OutputKeys.ENCODING, "UTF-8");
        t.setOutputProperty(OutputKeys.INDENT, "no");
        doc.setXmlStandalone(true);
        StringWriter out = new StringWriter();
        t.transform(new DOMSource(doc), new StreamResult(out));
        return out.toString();
    }
}
