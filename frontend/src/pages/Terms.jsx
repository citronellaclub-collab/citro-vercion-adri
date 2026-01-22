import React from 'react';

const Terms = () => {
    return (
        <div style={{ maxWidth: '960px', margin: 'auto', padding: '20px', color: 'var(--text-primary)', lineHeight: '1.6' }}>
            <h1 style={{ borderBottom: '1px solid var(--border)', paddingBottom: '10px' }}>Términos y Condiciones de Uso</h1>

            <div style={{ background: 'var(--bg-panel)', border: '1px solid var(--border)', padding: '16px', borderRadius: '10px', marginBottom: '28px', fontSize: '14px' }}>
                <strong>Versión de prueba:</strong><br />
                Este documento forma parte de una versión experimental de la plataforma, utilizada únicamente con fines de evaluación funcional y organizativa.
            </div>

            <section style={{ marginBottom: '28px' }}>
                <h2 style={{ fontSize: '18px', marginBottom: '8px' }}>1. Objeto</h2>
                <p>
                    El presente documento establece los Términos y Condiciones de uso de la plataforma digital (en adelante, <strong>“la Plataforma”</strong>), concebida como una herramienta privada de gestión interna, comunicación y organización para miembros de una asociación civil vinculada a actividades permitidas por la normativa vigente en la República Argentina.
                </p>
            </section>

            <section style={{ marginBottom: '28px' }}>
                <h2 style={{ fontSize: '18px', marginBottom: '8px' }}>2. Marco normativo</h2>
                <p>
                    La Plataforma se desarrolla en concordancia con el ordenamiento jurídico argentino, incluyendo de manera no exhaustiva:
                </p>
                <ul style={{ paddingLeft: '20px' }}>
                    <li>Ley N.º 27.350 y normativa complementaria.</li>
                    <li>Programa REPROCANN del Ministerio de Salud.</li>
                    <li>Código Civil y Comercial de la Nación.</li>
                    <li>Ley N.º 25.326 de Protección de Datos Personales.</li>
                </ul>
            </section>

            <section style={{ marginBottom: '28px' }}>
                <h2 style={{ fontSize: '18px', marginBottom: '8px' }}>3. Naturaleza de la Plataforma</h2>
                <p>
                    La Plataforma:
                </p>
                <ul style={{ paddingLeft: '20px' }}>
                    <li>No constituye un comercio electrónico.</li>
                    <li>No ofrece productos ni servicios al público en general.</li>
                    <li>No realiza actos de promoción, publicidad ni incentivo al consumo.</li>
                    <li>No sustituye controles administrativos, sanitarios ni legales.</li>
                </ul>
                <p>
                    Su finalidad es exclusivamente organizativa y experimental.
                </p>
            </section>

            <section style={{ marginBottom: '28px' }}>
                <h2 style={{ fontSize: '18px', marginBottom: '8px' }}>4. Acceso y uso</h2>
                <p>
                    El acceso a la Plataforma se encuentra restringido a usuarios autorizados, mayores de edad, que acepten expresamente estos Términos y Condiciones.
                </p>
                <p>
                    El uso indebido, fraudulento o contrario a la ley dará lugar a la suspensión inmediata del acceso.
                </p>
            </section>

            <section style={{ marginBottom: '28px' }}>
                <h2 style={{ fontSize: '18px', marginBottom: '8px' }}>5. Contenidos y funcionalidades</h2>
                <p>
                    Las funcionalidades disponibles tienen carácter informativo y organizativo.
                    Ninguna información contenida en la Plataforma debe interpretarse como asesoramiento médico, legal o técnico profesional.
                </p>
            </section>

            <section style={{ marginBottom: '28px' }}>
                <h2 style={{ fontSize: '18px', marginBottom: '8px' }}>6. Datos personales</h2>
                <p>
                    Los datos ingresados por los usuarios son utilizados exclusivamente para pruebas de funcionamiento y organización interna, conforme a lo establecido por la Ley 25.326.
                </p>
            </section>

            <section style={{ marginBottom: '28px' }}>
                <h2 style={{ fontSize: '18px', marginBottom: '8px' }}>7. Responsabilidad</h2>
                <p>
                    La Plataforma se provee “tal como está”, sin garantías explícitas ni implícitas.
                    Los responsables del desarrollo no asumen responsabilidad por interpretaciones erróneas, usos indebidos o decisiones tomadas a partir de la información disponible.
                </p>
            </section>

            <section style={{ marginBottom: '28px' }}>
                <h2 style={{ fontSize: '18px', marginBottom: '8px' }}>8. Modificaciones</h2>
                <p>
                    Estos Términos y Condiciones podrán ser modificados en cualquier momento durante la etapa de prueba, sin necesidad de notificación previa.
                </p>
            </section>

            <section style={{ marginBottom: '28px' }}>
                <h2 style={{ fontSize: '18px', marginBottom: '8px' }}>9. Aceptación</h2>
                <p>
                    El acceso y uso de la Plataforma implica la aceptación plena de los presentes Términos y Condiciones.
                </p>
            </section>

            <section style={{ marginBottom: '28px' }}>
                <h2 style={{ fontSize: '18px', marginBottom: '8px' }}>10. Jurisdicción</h2>
                <p>
                    Para cualquier cuestión derivada de la interpretación o aplicación de este documento, las partes se someten a la jurisdicción de los tribunales ordinarios de la República Argentina.
                </p>
            </section>
        </div>
    );
};

export default Terms;
